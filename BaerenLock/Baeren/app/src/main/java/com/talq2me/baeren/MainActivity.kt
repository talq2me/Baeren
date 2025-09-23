package com.talq2me.baeren

import android.app.AlertDialog
import android.content.Intent
import android.os.*
import android.webkit.*
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import android.provider.Settings
import android.net.Uri
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.*
import android.content.Context
import android.util.Log
import android.widget.LinearLayout
import android.widget.GridLayout
import android.widget.ImageView
import android.widget.TextView
import android.widget.ScrollView
import android.widget.EditText
import android.widget.Button
import androidx.core.view.ViewCompat.setLayerType
import android.view.View

class MainActivity : AppCompatActivity(), TextToSpeech.OnInitListener {

    private lateinit var webView: WebView
    private lateinit var tts: TextToSpeech
    private var rewardAppDialog: AlertDialog? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Load persistent whitelist
        RewardManager.loadAllowedApps(this)

        // ✅ Set up webView immediately so it's safe to use
        webView = WebView(this)
        setContentView(webView)
        initWebView()
        // Redundant with initWebView's clearCache and cacheMode = LOAD_NO_CACHE
        // webView.clearCache(true);
        // webView.clearFormData();

        // ✅ Now safe to call loadWebForChild()
        val prefs = getSharedPreferences("child_profile", MODE_PRIVATE)
        val child = prefs.getString("profile", null)

        if (child == null) {
            Handler(Looper.getMainLooper()).post {
                AlertDialog.Builder(this)
                    .setTitle("Who's using this tablet?")
                    .setMessage("Please select the child assigned to this device.")
                    .setPositiveButton("Child A") { _, _ ->
                        prefs.edit().putString("profile", "A").apply()
                        loadWebForChild("A")
                    }
                    .setNegativeButton("Child B") { _, _ ->
                        prefs.edit().putString("profile", "B").apply()
                        loadWebForChild("B")
                    }
                    .setCancelable(false)
                    .show()
            }
        } else {
            loadWebForChild(child)
        }

        // Check if this is a test report request
        if (intent.getBooleanExtra("test_report", false)) {
            Handler(Looper.getMainLooper()).postDelayed({
                sendUsageReport()
            }, 1000) // Small delay to ensure everything is loaded
        }

        // Init TTS and permissions
        tts = TextToSpeech(this, this)
        maybeRequestBatteryOptimization()
        maybeRequestOverlayPermission()
        webView.addJavascriptInterface(TTSBridge(), "AndroidTTS")

        webView.addJavascriptInterface(UsageTrackerBridge(), "AndroidUsageTracker")

        webView.addJavascriptInterface(PinBridge(webView), "Android")

    }



    private fun initWebView() {
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            useWideViewPort = true
            loadWithOverviewMode = true
            cacheMode = WebSettings.LOAD_NO_CACHE
            userAgentString = "Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
        }
        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.clearCache(true) // Clear cache on init
        // Redundant with cacheMode = LOAD_NO_CACHE and clearCache(true) above
        // webView.clearHistory()
        webView.webChromeClient = WebChromeClient()
        webView.settings.allowContentAccess = false


        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest): Boolean {
                val url = request.url.toString()

                if (url == "intent://sendusagereport") {
                    sendUsageReport() // call the email + reset logic
                    return true
                }

                // Special: open Read Along app via Play Store
                if (url.contains("readalong.google.com")) {
                    openPlayStore("com.google.android.apps.seekh")
                    return true
                }

                // Custom intent:// reward launcher
                if (url.startsWith("intent://")) {
                    try {
                        val intent = Intent.parseUri(url, Intent.URI_INTENT_SCHEME)
                        val minutes = intent.data?.getQueryParameter("minutes")?.toIntOrNull() ?: 10

                        Log.d("MainActivity", "Reward triggered: $minutes minutes")
                        // Show reward app picker dialog
                        showRewardAppPicker(minutes)
                    } catch (e: Exception) {
                        Log.e("MainActivity", "Intent error: ${e.message}", e)
                        Toast.makeText(this@MainActivity, "Intent error: "+e.message, Toast.LENGTH_LONG).show()
                    }
                    return true
                }

                return false
            }
        }
    }

    private fun setLayerType(layerTypeHardware: Any, nothing: Nothing?) {}

    private fun openPlayStore(pkg: String) {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$pkg"))
            intent.setPackage("com.android.vending")
            startActivity(intent)
        } catch (e: Exception) {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$pkg")))
        }
    }

    private fun maybeRequestBatteryOptimization() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = getSystemService(POWER_SERVICE) as PowerManager
            if (!pm.isIgnoringBatteryOptimizations(packageName)) {
                val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                    data = Uri.parse("package:$packageName")
                }
                startActivity(intent)
            }
        }
    }

    private fun maybeRequestOverlayPermission() {
        if (!Settings.canDrawOverlays(this)) {
            val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:$packageName"))
            startActivityForResult(intent, 1234)
        }
    }

    // TTS Setup
    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
                override fun onStart(utteranceId: String?) {}
                override fun onDone(utteranceId: String?) {
                    runOnUiThread {
                        webView.evaluateJavascript("if (typeof onTTSFinish === 'function') { onTTSFinish(); }", null)
                    }
                }
                override fun onError(utteranceId: String?) {
                    runOnUiThread {
                        webView.evaluateJavascript("if (typeof onTTSFinish === 'function') { onTTSFinish(); }", null)
                    }
                }
            })
        }
    }

    private fun loadWebForChild(child: String) {
        val url = when (child) {
            "A" -> "https://talq2me.github.io/Baeren/BaerenEd/homework/AM.html"
            "B" -> "https://talq2me.github.io/Baeren/BaerenEd/homework/BM.html"
            else -> "https://talq2me.github.io/Baeren/BaerenEd/index.html"
        }
        webView.loadUrl(url)
        webView.evaluateJavascript(
            """
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for (let registration of registrations) {
                        registration.unregister();
                    }
                });
            }
            """.trimIndent(), null
                )

    }


    inner class TTSBridge {
        @JavascriptInterface
        fun speak(text: String, lang: String, rate: Float = 1.0f) {
            val locale = when (lang.lowercase()) {
                "fr" -> Locale.FRENCH
                "en" -> Locale.US
                else -> Locale.US
            }
            if (tts.setLanguage(locale) == TextToSpeech.LANG_MISSING_DATA) {
                Toast.makeText(this@MainActivity, "Unsupported lang: $lang", Toast.LENGTH_SHORT).show()
                webView.evaluateJavascript("if (typeof onTTSFinish === 'function') { onTTSFinish(); }", null)
                return
            }

            // Apply the speech rate
            tts.setSpeechRate(rate);

            val params = Bundle()
            params.putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, 1.0f)
            val utteranceId = "utt_${System.currentTimeMillis()}"
            tts.stop()
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId)
        }
    }

    override fun onDestroy() {
        tts.stop()
        tts.shutdown()
        super.onDestroy()
    }

    inner class UsageTrackerBridge {
        @JavascriptInterface
        fun logVisit(page: String, durationSeconds: Int) {
            val prefs = getSharedPreferences("usage_data", MODE_PRIVATE)
            val current = prefs.getString(page, "0")?.toIntOrNull() ?: 0
            prefs.edit().putString(page, (current + durationSeconds).toString()).apply()
        }
    }

    fun sendUsageReport() {
        val prefs = getSharedPreferences("usage_data", MODE_PRIVATE)
        val allData = prefs.all

        // Get parent email from settings
        val settingsPrefs = getSharedPreferences("settings", MODE_PRIVATE)
        val parentEmail = settingsPrefs.getString("parent_email", null)
        
        if (parentEmail.isNullOrBlank()) {
            Toast.makeText(this, "Please set parent email in settings first", Toast.LENGTH_LONG).show()
            return
        }

        val report = StringBuilder("Today's Activity Report:\n\n")

        // Web usage data
        if (allData.isNotEmpty()) {
            report.append("📱 Web Activity:\n")
            for ((key, value) in allData) {
                val minutes = (value.toString().toIntOrNull() ?: 0) / 60
                val seconds = (value.toString().toIntOrNull() ?: 0) % 60
                report.append("  • $key: ${minutes}m ${seconds}s\n")
            }
            report.append("\n")
        }

        // Android app usage data (if permission granted)
        val appUsageData = getAndroidAppUsageData()
        if (appUsageData.isNotEmpty()) {
            report.append("📲 App Usage:\n")
            for ((appName, duration) in appUsageData) {
                val minutes = duration / 60
                val seconds = duration % 60
                report.append("  • $appName: ${minutes}m ${seconds}s\n")
            }
            report.append("\n")
        }

        if (allData.isEmpty() && appUsageData.isEmpty()) {
            Toast.makeText(this, "No usage data to report", Toast.LENGTH_SHORT).show()
            return
        }

        // Try to send via Gmail directly
        val gmailIntent = Intent(Intent.ACTION_SENDTO).apply {
            data = Uri.parse("mailto:")
            putExtra(Intent.EXTRA_EMAIL, arrayOf(parentEmail))
            putExtra(Intent.EXTRA_SUBJECT, "Daily Usage Report")
            putExtra(Intent.EXTRA_TEXT, report.toString())
            setPackage("com.google.android.gm")
        }
        if (gmailIntent.resolveActivity(packageManager) != null) {
            startActivity(gmailIntent)
        } else {
            // Fallback: show share sheet
            val fallbackIntent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, report.toString())
            }
            startActivity(Intent.createChooser(fallbackIntent, "Share Report"))
        }

        // ✅ Reset usage data after sending
        prefs.edit().clear().apply()
    }

    private fun getAndroidAppUsageData(): Map<String, Int> {
        val usageData = mutableMapOf<String, Int>()
        
        try {
            val usm = getSystemService(Context.USAGE_STATS_SERVICE) as android.app.usage.UsageStatsManager
            val end = System.currentTimeMillis()
            val begin = end - (24 * 60 * 60 * 1000) // Last 24 hours
            
            val stats = usm.queryUsageStats(android.app.usage.UsageStatsManager.INTERVAL_DAILY, begin, end)
            
            for (stat in stats) {
                val packageName = stat.packageName
                val totalTime = stat.totalTimeInForeground / 1000 // Convert to seconds
                
                // Skip system apps and our own app
                if (packageName != this@MainActivity.packageName && 
                    !packageName.startsWith("com.android.") &&
                    !packageName.startsWith("android.") &&
                    totalTime > 0) {
                    
                    val appName = try {
                        val appInfo = packageManager.getApplicationInfo(packageName, 0)
                        packageManager.getApplicationLabel(appInfo).toString()
                    } catch (e: Exception) {
                        packageName
                    }
                    
                    usageData[appName] = totalTime.toInt()
                }
            }
        } catch (e: Exception) {
            // Usage stats permission not granted or other error
            Log.d("MainActivity", "Could not get usage stats: ${e.message}")
        }
        
        return usageData.toList()
            .sortedByDescending { it.second }
            .take(10) // Top 10 apps
            .toMap()
    }

    private fun showRewardAppPicker(minutes: Int) {
        Log.d("MainActivity", "showRewardAppPicker called with $minutes minutes")
        
        val prefs = getSharedPreferences("settings", MODE_PRIVATE)
        val rewardApps = prefs.getStringSet("reward_apps", emptySet())?.toList() ?: emptyList()
        Log.d("MainActivity", "Found ${rewardApps.size} reward apps configured")
        
        if (rewardApps.isEmpty()) {
            Toast.makeText(this, "No reward apps configured. Please ask a parent to set them in settings.", Toast.LENGTH_LONG).show()
            return
        }
        val pm = packageManager
        val appInfos = rewardApps.mapNotNull { pkg ->
            try {
                val appInfo = pm.getApplicationInfo(pkg, 0)
                val label = pm.getApplicationLabel(appInfo).toString()
                val icon = pm.getApplicationIcon(appInfo)
                Triple(pkg, label, icon)
            } catch (e: Exception) {
                Log.e("MainActivity", "Error loading app info for $pkg: ${e.message}")
                null
            }
        }
        Log.d("MainActivity", "Loaded ${appInfos.size} valid app infos")
        
        if (appInfos.isEmpty()) {
            Toast.makeText(this, "No valid reward apps found.", Toast.LENGTH_LONG).show()
            return
        }
        
        // Better orientation detection
        val displayMetrics = resources.displayMetrics
        val isLandscape = displayMetrics.widthPixels > displayMetrics.heightPixels
        
        val columns = if (isLandscape) 8 else 5
        val rows = if (isLandscape) 3 else 5
        
        Log.d("MainActivity", "Screen: ${displayMetrics.widthPixels}x${displayMetrics.heightPixels}, Landscape: $isLandscape, Grid: ${columns}x${rows}")
        
        // Debug toast
        Toast.makeText(this, "Orientation: ${if (isLandscape) "Landscape" else "Portrait"} - Grid: ${columns}x${rows}", Toast.LENGTH_SHORT).show()
        
        val grid = GridLayout(this).apply {
            columnCount = columns
            rowCount = rows
            useDefaultMargins = false
            setPadding(16, 16, 16, 16)
        }
        
        Log.d("MainActivity", "Creating grid with ${columns}x${rows} layout")
        
        appInfos.forEachIndexed { index, (pkg, label, icon) ->
            val row = index / columns
            val col = index % columns
            
            Log.d("MainActivity", "Adding app $index ($label) at position ($row, $col)")
            
            val item = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = android.view.Gravity.CENTER
                setPadding(8, 8, 8, 8)
                layoutParams = GridLayout.LayoutParams().apply {
                    width = 0
                    height = GridLayout.LayoutParams.WRAP_CONTENT
                    columnSpec = GridLayout.spec(col, 1f)
                    rowSpec = GridLayout.spec(row, 1f)
                    setMargins(8, 8, 8, 8)
                }
            }
            val iconView = ImageView(this).apply {
                setImageDrawable(icon)
                layoutParams = LinearLayout.LayoutParams(120, 120)
            }
            val labelView = TextView(this).apply {
                text = label
                gravity = android.view.Gravity.CENTER
                textSize = 12f
                setTextColor(android.graphics.Color.BLACK)
                maxLines = 2
            }
            item.addView(iconView)
            item.addView(labelView)
            item.setOnClickListener {
                Log.d("MainActivity", "App selected: $pkg for $minutes minutes")
                // Grant access and launch
                RewardManager.grantAccess(this@MainActivity, pkg, minutes)
                val launchIntent = pm.getLaunchIntentForPackage(pkg)
                if (launchIntent != null) {
                    startActivity(launchIntent)
                } else {
                    Toast.makeText(this, "App not installed: $pkg", Toast.LENGTH_SHORT).show()
                }
                rewardAppDialog?.dismiss()
            }
            grid.addView(item)
        }
        
        Log.d("MainActivity", "Showing reward picker dialog")
        val dialog = AlertDialog.Builder(this)
            .setTitle("Pick your reward app")
            .setView(ScrollView(this).apply { addView(grid) })
            .setCancelable(false)
            .create()
        rewardAppDialog = dialog
        dialog.show()
    }

    inner class PinBridge(private val webView: WebView) {
        @android.webkit.JavascriptInterface
        fun showPinPrompt() {
            runOnUiThread {
                showPinPrompt { pin ->
                    webView.evaluateJavascript("window.onPinResult('" + pin + "')", null)
                }
            }
        }
    }

    fun showPinPrompt(onPinEntered: (String) -> Unit) {
        val prefs = getSharedPreferences("settings", MODE_PRIVATE)
        val storedPin = prefs.getString("parent_pin", "1234") ?: "1234"
        PinPromptDialog.show(this, "Enter PIN") { enteredPin ->
            if (enteredPin == storedPin) {
                onPinEntered(enteredPin)
            } else {
                // Show error and re-prompt
                Toast.makeText(this, "Incorrect PIN", Toast.LENGTH_SHORT).show()
                showPinPrompt(onPinEntered)
            }
        }
    }

}
