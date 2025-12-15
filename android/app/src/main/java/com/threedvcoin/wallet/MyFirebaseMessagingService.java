package com.threedvcoin.wallet;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String TAG = "FCMService";
    private static final String CHANNEL_ID = "vcoin_notifications";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        try {
            Log.d(TAG, "메시지 수신: " + remoteMessage.getFrom());

            // 데이터 페이로드 확인
            if (remoteMessage.getData().size() > 0) {
                Log.d(TAG, "데이터: " + remoteMessage.getData());
            }

            // 알림 페이로드 확인 및 표시
            if (remoteMessage.getNotification() != null) {
                String title = remoteMessage.getNotification().getTitle();
                String body = remoteMessage.getNotification().getBody();
                Log.d(TAG, "알림 제목: " + title);
                Log.d(TAG, "알림 내용: " + body);

                sendNotification(title, body);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error processing received message", e);
        }
    }

    @Override
    public void onNewToken(String token) {
        super.onNewToken(token);
        Log.d(TAG, "새 FCM 토큰: " + token);
        // 새 토큰은 MainActivity에서 처리함
    }

    private void sendNotification(String title, String messageBody) {
        try {
            Intent intent = new Intent(this, MainActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);

            PendingIntent pendingIntent = PendingIntent.getActivity(
                    this,
                    0,
                    intent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_ONE_SHOT);

            Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

            NotificationCompat.Builder notificationBuilder = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title != null ? title : "V COIN")
                    .setContentText(messageBody != null ? messageBody : "새 알림이 있습니다.")
                    .setAutoCancel(true)
                    .setSound(defaultSoundUri)
                    .setContentIntent(pendingIntent)
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setDefaults(NotificationCompat.DEFAULT_ALL)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);

            NotificationManager notificationManager = (NotificationManager) getSystemService(
                    Context.NOTIFICATION_SERVICE);

            if (notificationManager == null)
                return;

            // Android O 이상에서는 알림 채널 필요
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        "V COIN 알림",
                        NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("V COIN 앱 알림");
                channel.enableVibration(true);
                channel.enableLights(true);
                channel.setShowBadge(true);
                channel.setLockscreenVisibility(NotificationCompat.VISIBILITY_PUBLIC);
                notificationManager.createNotificationChannel(channel);
            }

            // 고유 ID로 알림 표시 (시간 기반)
            int notificationId = (int) System.currentTimeMillis();
            notificationManager.notify(notificationId, notificationBuilder.build());

            Log.d(TAG, "알림 표시 완료: ID=" + notificationId);
        } catch (Exception e) {
            Log.e(TAG, "Error sending notification", e);
        }
    }
}
