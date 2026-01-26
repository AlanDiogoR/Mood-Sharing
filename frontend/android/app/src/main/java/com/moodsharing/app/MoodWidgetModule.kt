package com.moodsharing.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class MoodWidgetModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "MoodWidgetModule"

  @ReactMethod
  fun updateMoodWidget(partnerName: String?, partnerMessage: String?, partnerPhotoUrl: String?) {
    val prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val safePhotoUrl = partnerPhotoUrl?.trim()?.takeIf { it.isNotEmpty() }
    prefs.edit()
      .putString(KEY_PARTNER_NAME, partnerName ?: "Parceiro")
      .putString(KEY_PARTNER_MESSAGE, partnerMessage ?: "Atualizou o humor")
      .putString(KEY_PARTNER_PHOTO, safePhotoUrl)
      .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
      .apply()

    val appWidgetManager = AppWidgetManager.getInstance(reactContext)
    val componentName = ComponentName(reactContext, MoodWidgetProvider::class.java)
    val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
    for (widgetId in widgetIds) {
      MoodWidgetProvider.updateAppWidget(reactContext, appWidgetManager, widgetId)
    }
  }

  companion object {
    private const val PREFS_NAME = "MoodWidgetPrefs"
    private const val KEY_PARTNER_NAME = "partnerName"
    private const val KEY_PARTNER_MESSAGE = "partnerMessage"
    private const val KEY_UPDATED_AT = "updatedAt"
    private const val KEY_PARTNER_PHOTO = "partnerPhotoUrl"
  }
}
