package com.talq2me.baeren

import android.content.Context
import android.content.Intent
import android.os.Handler
import android.os.Looper
import android.util.Log

object RewardManager {
    val allowedApps = mutableSetOf("com.talq2me.baeren")
    private val temporaryApps = mutableSetOf<String>()
    private var timer: Handler? = null
    private var runnable: Runnable? = null

    fun grantAccess(context: Context, pkg: String, minutes: Int) {
        allowedApps.add(pkg)
        temporaryApps.add(pkg)
        saveAllowedApps(context)

        runnable?.let { timer?.removeCallbacks(it) }
        timer = Handler(Looper.getMainLooper())
        runnable = Runnable {
            Log.d("RewardManager", "🚫 Reward time expired for $pkg - removing from allowed apps")
            allowedApps.remove(pkg)
            temporaryApps.remove(pkg)
            saveAllowedApps(context)
            Log.d("RewardManager", "Updated allowed apps: $allowedApps")

            // 🚫 Try to kill the app's background processes
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
            am.killBackgroundProcesses(pkg)

            // ✅ Return to launcher/home
            val intent = Intent(Intent.ACTION_MAIN)
            intent.addCategory(Intent.CATEGORY_HOME)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            context.startActivity(intent)
        }
        timer?.postDelayed(runnable!!, minutes * 60 * 1000L)
    }

    fun isAllowed(pkg: String): Boolean {
        val allowed = allowedApps.contains(pkg)
        Log.d("RewardManager", "Checking if $pkg is allowed: $allowed (current allowed apps: $allowedApps)")
        return allowed
    }

    fun addToWhitelist(pkg: String, context: Context) {
        allowedApps.add(pkg)
        saveAllowedApps(context)
    }

    fun removeFromWhitelist(pkg: String, context: Context) {
        allowedApps.remove(pkg)
        saveAllowedApps(context)
    }

    fun saveAllowedApps(context: Context) {
        val prefs = context.getSharedPreferences("whitelist_prefs", Context.MODE_PRIVATE)
        // Only save permanent apps, not temporary reward apps
        val permanentApps = allowedApps.filter { !temporaryApps.contains(it) }.toSet()
        prefs.edit().putStringSet("allowed", permanentApps).apply()
    }

    fun loadAllowedApps(context: Context) {
        val prefs = context.getSharedPreferences("whitelist_prefs", Context.MODE_PRIVATE)
        val stored = prefs.getStringSet("allowed", null)
        if (stored != null) {
            allowedApps.clear()
            allowedApps.addAll(stored)
            // Don't reload temporary apps from storage
        }
    }
}


