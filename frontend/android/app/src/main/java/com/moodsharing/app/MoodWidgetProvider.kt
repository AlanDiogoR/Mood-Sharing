package com.moodsharing.app

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import android.text.format.DateFormat
import android.view.View
import java.util.Date
import java.util.Calendar
import java.util.Locale
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.AppWidgetTarget

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
    private const val KEY_PARTNER_PHOTO = "partnerPhotoUrl"
    private const val KEY_PARTNER_MOOD_TYPE = "partnerMoodType"
    private const val KEY_PARTNER_DISTANCE = "partnerDistanceKm"

    fun updateAppWidget(context: Context, appWidgetManager: AppWidgetManager, appWidgetId: Int) {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val partnerName = prefs.getString(KEY_PARTNER_NAME, "Parceiro") ?: "Parceiro"
      val partnerMessage = prefs.getString(KEY_PARTNER_MESSAGE, "Atualizou o humor") ?: "Atualizou o humor"
      val updatedAt = prefs.getLong(KEY_UPDATED_AT, System.currentTimeMillis())
      val partnerPhotoUrl = prefs.getString(KEY_PARTNER_PHOTO, null)
      val partnerMoodType = prefs.getString(KEY_PARTNER_MOOD_TYPE, null)
      val partnerDistanceKm = prefs.getFloat(KEY_PARTNER_DISTANCE, -1f)
      val timeText = DateFormat.format("HH:mm", Date(updatedAt)).toString()
      val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
      val (greetingText, backgroundRes) = when (hour) {
        in 5..11 -> "Bom dia" to R.drawable.widget_background_morning
        in 12..18 -> "Boa tarde" to R.drawable.widget_background_afternoon
        in 19..23 -> "Boa noite" to R.drawable.widget_background_night
        else -> "Boa madrugada" to R.drawable.widget_background_dawn
      }
      val moodDisplay = when (partnerMoodType) {
        "happy" -> "😊 Feliz"
        "sad" -> "😢 Triste"
        "anxious" -> "😰 Ansioso"
        "calm" -> "😌 Calmo"
        "excited" -> "🤩 Empolgado"
        "tired" -> "😴 Cansado"
        "angry" -> "😠 Irritado"
        "love" -> "❤️ Apaixonado"
        else -> "🙂 Humor"
      }

      val views = RemoteViews(context.packageName, R.layout.mood_widget)
      views.setInt(R.id.widget_container, "setBackgroundResource", backgroundRes)
      views.setTextViewText(R.id.widget_partner_greeting, greetingText)
      views.setTextViewText(R.id.widget_partner_name, partnerName)
      views.setTextViewText(R.id.widget_partner_message, partnerMessage)
      views.setTextViewText(R.id.widget_partner_mood, moodDisplay)
      views.setTextViewText(R.id.widget_updated_at, "Atualizado: $timeText")
      if (partnerDistanceKm >= 0f) {
        val distanceText = String.format(Locale.getDefault(), "Distância: %.2f km", partnerDistanceKm)
        views.setTextViewText(R.id.widget_partner_distance, distanceText)
        views.setViewVisibility(R.id.widget_partner_distance, View.VISIBLE)
      } else {
        views.setViewVisibility(R.id.widget_partner_distance, View.GONE)
      }

      if (partnerPhotoUrl.isNullOrBlank()) {
        views.setImageViewResource(R.id.widget_partner_photo, R.drawable.widget_avatar_placeholder)
      } else {
        val appWidgetTarget = AppWidgetTarget(context, R.id.widget_partner_photo, views, appWidgetId)
        Glide.with(context.applicationContext)
          .asBitmap()
          .load(partnerPhotoUrl)
          .placeholder(R.drawable.widget_avatar_placeholder)
          .error(R.drawable.widget_avatar_placeholder)
          .into(appWidgetTarget)
      }

      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}
