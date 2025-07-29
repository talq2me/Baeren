package com.talq2me.baeren

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class SettingsActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)

        val emailInput = findViewById<EditText>(R.id.emailInput)
        val saveButton = findViewById<Button>(R.id.saveButton)
        val backButton = findViewById<Button>(R.id.backButton)
        val testReportButton = findViewById<Button>(R.id.testReportButton)

        // Load current email
        val prefs = getSharedPreferences("settings", MODE_PRIVATE)
        val currentEmail = prefs.getString("parent_email", "")
        emailInput.setText(currentEmail)

        saveButton.setOnClickListener {
            val email = emailInput.text.toString().trim()
            if (email.isNotEmpty() && android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
                prefs.edit().putString("parent_email", email).apply()
                Toast.makeText(this, "Email saved successfully", Toast.LENGTH_SHORT).show()
                finish()
            } else {
                Toast.makeText(this, "Please enter a valid email address", Toast.LENGTH_SHORT).show()
            }
        }

        backButton.setOnClickListener {
            finish()
        }

        testReportButton.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            intent.putExtra("test_report", true)
            startActivity(intent)
        }
    }
} 