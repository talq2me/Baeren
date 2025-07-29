package com.talq2me.baeren

import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.InputType
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import java.util.Calendar

class LauncherActivity : AppCompatActivity() {

    private val handler = Handler(Looper.getMainLooper())
    private var rewardRunnable: Runnable? = null
    private lateinit var appGrid: GridLayout
    private var accessibilityBanner: Button? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        RewardManager.loadAllowedApps(this)
        
        // Check if accessibility service is enabled
        val isEnabled = isAccessibilityServiceEnabled()
        Log.d("LauncherActivity", "Accessibility service enabled: $isEnabled")

        val background = createDailyBackgroundImageView()

        val contentLayout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(8, 8, 8, 8)
        }

        val root = FrameLayout(this).apply {
            addView(background)
            addView(contentLayout)
        }

        // Accessibility banner placeholder
        accessibilityBanner = Button(this).apply {
            text = "Enable Protection (Accessibility)"
            setBackgroundColor(0xFFE57373.toInt())
            setTextColor(0xFFFFFFFF.toInt())
            setOnClickListener {
                val intent = Intent(android.provider.Settings.ACTION_ACCESSIBILITY_SETTINGS)
                startActivity(intent)
            }
        }
        contentLayout.addView(accessibilityBanner, 0)

        val topBar = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END
        }

        val settingsButton = ImageButton(this).apply {
            setImageResource(R.drawable.ic_settings)
            setBackgroundColor(Color.TRANSPARENT)
            setPadding(16, 16, 16, 16) // Add padding for larger touch target
            layoutParams = LinearLayout.LayoutParams(80, 80) // Make button bigger
            setOnClickListener {
                showPinPrompt(onSuccess = {
                    showSettingsMenu()
                })
            }
        }

        topBar.addView(settingsButton)

        val breakGlassButton = ImageButton(this).apply {
            setImageResource(R.drawable.exit_launcher)
            setBackgroundColor(Color.TRANSPARENT)
            setPadding(16, 16, 16, 16) // Add padding for larger touch target
            layoutParams = LinearLayout.LayoutParams(80, 80) // Make button bigger
            setOnClickListener {
                showPinPrompt(onSuccess = {
                    exitLauncher()
                })
            }
        }
        topBar.addView(breakGlassButton)

        val webAppButton = Button(this).apply {
            text = "Baeren"
        }

        appGrid = GridLayout(this).apply {
            // Adaptive grid based on orientation
            val displayMetrics = resources.displayMetrics
            val isLandscape = displayMetrics.widthPixels > displayMetrics.heightPixels
            
            columnCount = if (isLandscape) 8 else 5
            useDefaultMargins = false
        }

        contentLayout.addView(topBar)
        contentLayout.addView(webAppButton)
        contentLayout.addView(appGrid)

        setContentView(root)

        updateAccessibilityBanner(contentLayout)
        refreshIcons(appGrid)
    }

    private fun refreshIcons(container: ViewGroup) {
        container.removeAllViews()
        val pm = packageManager
        val apps = pm.queryIntentActivities(
            Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LAUNCHER),
            0
        )
        
        val allowedApps = apps.filter { RewardManager.allowedApps.contains(it.activityInfo.packageName) }
        
        // Update grid dimensions based on current orientation
        val displayMetrics = resources.displayMetrics
        val isLandscape = displayMetrics.widthPixels > displayMetrics.heightPixels
        val columns = if (isLandscape) 8 else 5
        
        // Update the grid's column count
        if (container is GridLayout) {
            container.columnCount = columns
        }
        
        allowedApps.forEach { ri ->
            val appLayout = LinearLayout(this).apply {
                orientation = LinearLayout.VERTICAL
                gravity = Gravity.CENTER
                layoutParams = GridLayout.LayoutParams().apply {
                    width = 150
                    height = 180
                    setMargins(4, 4, 4, 4)
                }
            }

            val icon = ImageView(this).apply {
                setImageDrawable(ri.loadIcon(pm))
                scaleType = ImageView.ScaleType.CENTER_INSIDE
                layoutParams = LinearLayout.LayoutParams(120, 120)
                setOnClickListener {
                    if (ri.activityInfo.packageName == packageName) {
                        val intent = Intent(this@LauncherActivity, MainActivity::class.java)
                        startActivity(intent)
                    } else {
                        val intent = packageManager.getLaunchIntentForPackage(ri.activityInfo.packageName)
                        if (intent != null) startActivity(intent)
                    }
                }
            }

            val label = TextView(this).apply {
                text = ri.loadLabel(pm).toString()
                gravity = Gravity.CENTER
                setTextColor(Color.WHITE)
                textSize = 10f
                maxLines = 1
                isSingleLine = true
                ellipsize = android.text.TextUtils.TruncateAt.END
            }

            appLayout.addView(icon)
            appLayout.addView(label)
            container.addView(appLayout)
        }
    }

    private fun launchApp(pkg: String) {
        val intent = packageManager.getLaunchIntentForPackage(pkg)
        if (intent != null) startActivity(intent)
        else Toast.makeText(this, "App not installed", Toast.LENGTH_SHORT).show()
    }

    private fun bringHome() {
        val home = Intent(this, LauncherActivity::class.java)
        home.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        startActivity(home)
    }

    private fun showPinPrompt(onSuccess: () -> Unit) {
        val prefs = getSharedPreferences("settings", MODE_PRIVATE)
        val storedPin = prefs.getString("parent_pin", "1234") ?: "1234"
        PinPromptDialog.show(this, "Enter PIN") { enteredPin ->
            if (enteredPin == storedPin) {
                onSuccess()
            } else {
                Toast.makeText(this, "Incorrect PIN", Toast.LENGTH_SHORT).show()
                showPinPrompt(onSuccess)
            }
        }
    }

    private fun isAccessibilityServiceEnabled(): Boolean {
        val expected = "$packageName/${AppBlockerService::class.java.name}"
        val enabledServices = android.provider.Settings.Secure.getString(
            contentResolver,
            android.provider.Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        // Check for both flattened and unflattened names
        return enabledServices.split(':').any {
            it.equals(expected, ignoreCase = true) ||
            it.endsWith(AppBlockerService::class.java.name, ignoreCase = true)
        }
    }

    private fun showSettingsMenu() {
        AlertDialog.Builder(this)
            .setTitle("Settings")
            .setItems(arrayOf("App Whitelist", "Reward Apps", "Parent Email Settings", "Change PIN")) { _, which ->
                when (which) {
                    0 -> startActivity(Intent(this@LauncherActivity, WhitelistSettingsActivity::class.java))
                    1 -> startActivity(Intent(this@LauncherActivity, RewardAppsSettingsActivity::class.java))
                    2 -> startActivity(Intent(this@LauncherActivity, SettingsActivity::class.java))
                    3 -> startActivity(Intent(this@LauncherActivity, ChangePinActivity::class.java))
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    private fun exitLauncher() {
        val intent = Intent(android.provider.Settings.ACTION_HOME_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        startActivity(intent)

        Toast.makeText(this, "Choose a different default launcher in settings.", Toast.LENGTH_LONG).show()
    }

    private fun createDailyBackgroundImageView(): ImageView {
        val prefs = getSharedPreferences("child_profile", MODE_PRIVATE)
        val child = prefs.getString("profile", "A") ?: "A"

        val backgroundsA = listOf(R.drawable.bg_a_1, R.drawable.bg_a_2, R.drawable.bg_a_3)
        val backgroundsB = listOf(R.drawable.bg_b_1, R.drawable.bg_b_2, R.drawable.bg_b_3)

        val dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
        val index = dayOfYear % 3

        val bgRes = when (child) {
            "A" -> backgroundsA[index]
            "B" -> backgroundsB[index]
            else -> R.drawable.bg_a_1
        }

        return ImageView(this).apply {
            setImageResource(bgRes)
            scaleType = ImageView.ScaleType.CENTER_CROP
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
    }

    override fun onBackPressed() {
        super.onBackPressed() /* ignore */ }

    override fun onResume() {
        super.onResume()
        // Refresh the app grid when returning from settings
        refreshIcons(appGrid)
        // Get the content layout properly - it's the parent of appGrid
        val contentLayout = appGrid.parent as? LinearLayout
        contentLayout?.let { updateAccessibilityBanner(it) }
    }

    private fun updateAccessibilityBanner(contentLayout: LinearLayout) {
        val isEnabled = isAccessibilityServiceEnabled()
        accessibilityBanner?.visibility = if (isEnabled) View.GONE else View.VISIBLE
    }
}
