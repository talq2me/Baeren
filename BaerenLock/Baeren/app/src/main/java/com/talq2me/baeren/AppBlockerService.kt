package com.talq2me.baeren

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.util.Log
import android.os.Handler
import android.os.Looper
import android.app.ActivityManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.app.usage.UsageEvents
import android.provider.Settings

class AppBlockerService : AccessibilityService() {

    private var lastPackage: String? = null
    private val handler = Handler(Looper.getMainLooper())
    private val periodicCheck = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, 2000) // Check every 2 seconds
        }
    }

    private val usageHandler = Handler(Looper.getMainLooper())
    private val usageCheck = object : Runnable {
        override fun run() {
            checkUsageStats()
            usageHandler.postDelayed(this, 2000)
        }
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent) {
        // Log all events for debugging
        Log.d("AppBlocker", "Event received: type=${event.eventType}, package=${event.packageName}, class=${event.className}")
        
        // Listen to more event types to catch all app switches
        if (event.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED && 
            event.eventType != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED &&
            event.eventType != AccessibilityEvent.TYPE_VIEW_FOCUSED) {
            return
        }

        val pkgName = event.packageName?.toString() ?: return

        // Ignore launcher, system UI, and our own app
        if (pkgName == "com.android.systemui" || 
            pkgName == "com.android.launcher" ||
            pkgName == "com.android.launcher3" ||
            pkgName == "com.google.android.apps.nexuslauncher" ||
            pkgName == packageName) {
            lastPackage = pkgName
            Log.d("AppBlocker", "Ignoring system app: $pkgName")
            return
        }

        // Don't process the same package multiple times in a row
        if (pkgName == lastPackage) {
            Log.d("AppBlocker", "Same package as last time: $pkgName")
            return
        }

        // Log for debugging
        Log.d("AppBlocker", "App switched to: $pkgName, allowed: ${RewardManager.isAllowed(pkgName)}")
        Log.d("AppBlocker", "Current allowed apps: ${RewardManager.allowedApps}")

        // 🚫 Block any app that's not allowed
        if (!RewardManager.isAllowed(pkgName)) {
            Log.d("AppBlocker", "🚫 BLOCKING access to: $pkgName - returning to launcher")
            lastPackage = pkgName
            returnToLauncher()
            return
        }

        lastPackage = pkgName
    }

    override fun onInterrupt() {}

    override fun onServiceConnected() {
        super.onServiceConnected()
        Log.d("AppBlocker", "Accessibility service connected and ready to block apps")
        handler.post(periodicCheck)
        // Start UsageStats polling
        if (!hasUsageStatsPermission()) {
            promptForUsageAccess()
        } else {
            usageHandler.post(usageCheck)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(periodicCheck)
        usageHandler.removeCallbacks(usageCheck)
    }

    private fun checkForegroundApp() {
        try {
            //Log.d("AppBlocker", "Periodic check running...")
            
            val am = getSystemService(ACTIVITY_SERVICE) as ActivityManager
            val processes = am.runningAppProcesses
            
            if (processes != null) {
                for (process in processes) {
                    if (process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND) {
                        val pkgName = process.processName
                        Log.d("AppBlocker", "Foreground process: $pkgName")
                        
                        // Ignore launcher, system UI, and our own app
                        if (pkgName == "com.android.systemui" || 
                            pkgName == "com.android.launcher" ||
                            pkgName == "com.android.launcher3" ||
                            pkgName == "com.google.android.apps.nexuslauncher" ||
                            pkgName == packageName) {
                            Log.d("AppBlocker", "Ignoring system app: $pkgName")
                            continue
                        }

                        Log.d("AppBlocker", "Periodic check - Foreground app: $pkgName, allowed: ${RewardManager.isAllowed(pkgName)}")

                        // 🚫 Block any app that's not allowed
                        if (!RewardManager.isAllowed(pkgName)) {
                            Log.d("AppBlocker", "🚫 PERIODIC CHECK - BLOCKING access to: $pkgName - returning to launcher")
                            returnToLauncher()
                            return
                        }
                    }
                }
            } else {
                Log.d("AppBlocker", "No running processes found")
            }
            
        } catch (e: Exception) {
            Log.e("AppBlocker", "Error in periodic check", e)
        }
    }

    private fun returnToLauncher() {
        Log.d("AppBlocker", "Returning to launcher...")
        val intent = Intent(this, LauncherActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP)
        }
        startActivity(intent)
    }

    private fun hasUsageStatsPermission(): Boolean {
        try {
            val appOps = getSystemService(Context.APP_OPS_SERVICE) as android.app.AppOpsManager
            val mode = appOps.checkOpNoThrow(
                "android:get_usage_stats",
                android.os.Process.myUid(),
                packageName
            )
            return mode == android.app.AppOpsManager.MODE_ALLOWED
        } catch (e: Exception) {
            return false
        }
    }

    private fun promptForUsageAccess() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        startActivity(intent)
    }

    private fun checkUsageStats() {
        try {
            val usm = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
            val end = System.currentTimeMillis()
            val begin = end - 5000 // last 5 seconds
            val events = usm.queryEvents(begin, end)
            val event = UsageEvents.Event()
            var lastForeground: String? = null
            while (events.hasNextEvent()) {
                events.getNextEvent(event)
                if (event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND) {
                    lastForeground = event.packageName
                    Log.d("AppBlocker", "USAGESTATS: MOVE_TO_FOREGROUND: $lastForeground")
                }
            }
            val pkgName = lastForeground ?: run {
                Log.d("AppBlocker", "USAGESTATS: No foreground app detected")
                return
            }
            Log.d("AppBlocker", "USAGESTATS: Last foreground app: $pkgName")
            if (pkgName == packageName || pkgName == "com.android.systemui" || pkgName == "com.android.launcher" || pkgName == "com.android.launcher3" || pkgName == "com.google.android.apps.nexuslauncher") {
                return
            }
            if (!RewardManager.isAllowed(pkgName)) {
                Log.d("AppBlocker", "USAGESTATS - BLOCKING access to: $pkgName - returning to launcher")
                returnToLauncher()
            }
        } catch (e: Exception) {
            Log.e("AppBlocker", "USAGESTATS: Error in checkUsageStats", e)
        }
    }
}
