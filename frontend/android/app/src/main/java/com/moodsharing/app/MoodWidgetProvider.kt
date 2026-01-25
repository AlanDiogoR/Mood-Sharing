package com.moodsharing.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.text.format.DateFormat
import java.util.Date

class MoodWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
    for (appWidgetId in appWidgetIds) {
      updateAppWidget(context, appWidgetManager, appWidgetId)
    }
  }

  companion object {
    private const val PREFS_NAME = "MoodWidgetPrefs"
    private const val KEY_PARTNER_NAME = "partnerName"
    private const val KEY_PARTNER_MESSAGE = "partnerMessage"
    private const val KEY_UPDATED_AT = "updatedAt"

    fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val partnerName = prefs.getString(KEY_PARTNER_NAME, "Parceiro") ?: "Parceiro"
      val partnerMessage = prefs.getString(KEY_PARTNER_MESSAGE, "Atualizou o humor") ?: "Atualizou o humor"
      val updatedAt = prefs.getLong(KEY_UPDATED_AT, System.currentTimeMillis())
      val timeText = DateFormat.format("HH:mm", Date(updatedAt)).toString()

      val views = RemoteViews(context.packageName, R.layout.mood_widget)
      views.setTextViewText(R.id.widget_partner_name, partnerName)
      views.setTextViewText(R.id.widget_partner_message, partnerMessage)
      views.setTextViewText(R.id.widget_updated_at, "Atualizado: $timeText")
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}
