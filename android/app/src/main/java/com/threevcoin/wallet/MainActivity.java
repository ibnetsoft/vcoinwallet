package com.threevcoin.wallet;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int NOTIFICATION_PERMISSION_CODE = 1001;
    private String fcmToken = null;
    private boolean pageLoaded = false;
    private Handler handler = new Handler(Looper.getMainLooper());

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
        requestNotificationPermission();

        // 페이지 로드 완료 감지를 위한 WebViewClient 설정
        handler.postDelayed(() -> {
            WebView webView = getBridge().getWebView();
            if (webView != null) {
                webView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        super.onPageFinished(view, url);
                        Log.d(TAG, "페이지 로드 완료: " + url);
                        pageLoaded = true;

                        // 페이지 로드 후 약간의 딜레이를 주고 토큰 주입
                        handler.postDelayed(() -> {
                            if (fcmToken != null) {
                                injectFCMToken(view, fcmToken);
                            }
                        }, 2000); // 2초 딜레이 (React 앱 초기화 대기)
                    }
                });
            }
            initFCM();
        }, 500);
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                "vcoin_notifications",
                "V COIN 알림",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("V COIN 앱 알림 (새 회원 가입, 공지사항 등)");
            channel.enableVibration(true);
            channel.enableLights(true);
            channel.setShowBadge(true);

            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }

    private void requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this,
                        new String[]{Manifest.permission.POST_NOTIFICATIONS},
                        NOTIFICATION_PERMISSION_CODE);
            }
        }
    }

    private void initFCM() {
        FirebaseMessaging.getInstance().getToken()
            .addOnCompleteListener(task -> {
                if (!task.isSuccessful()) {
                    Log.w(TAG, "FCM 토큰 가져오기 실패", task.getException());
                    return;
                }

                fcmToken = task.getResult();
                Log.d(TAG, "FCM 토큰 획득: " + fcmToken);

                // 페이지가 이미 로드되었으면 바로 주입, 아니면 onPageFinished에서 주입
                if (pageLoaded) {
                    runOnUiThread(() -> {
                        WebView webView = getBridge().getWebView();
                        if (webView != null) {
                            injectFCMToken(webView, fcmToken);
                        }
                    });
                }
            });
    }

    private void injectFCMToken(WebView webView, String token) {
        Log.d(TAG, "FCM 토큰 JavaScript로 주입 시도: " + token);

        // 토큰을 window 객체에 저장하고, 콜백이 있으면 호출, 없으면 주기적으로 재시도
        String script =
            "console.log('FCM 토큰 주입 시작');" +
            "window.NATIVE_FCM_TOKEN = '" + token + "';" +
            "window.IS_NATIVE_APP = true;" +
            "if (typeof window.onFCMToken === 'function') {" +
            "  console.log('onFCMToken 콜백 호출');" +
            "  window.onFCMToken('" + token + "');" +
            "} else {" +
            "  console.log('onFCMToken 콜백 없음, 이벤트 발생');" +
            "  window.dispatchEvent(new CustomEvent('fcmToken', { detail: '" + token + "' }));" +
            "}";

        webView.evaluateJavascript(script, result -> {
            Log.d(TAG, "JavaScript 실행 결과: " + result);
        });

        // 3초 후에 다시 한번 시도 (안전장치)
        handler.postDelayed(() -> {
            String retryScript =
                "if (window.NATIVE_FCM_TOKEN && typeof window.onFCMToken === 'function') {" +
                "  console.log('FCM 토큰 재시도');" +
                "  window.onFCMToken(window.NATIVE_FCM_TOKEN);" +
                "}";
            webView.evaluateJavascript(retryScript, null);
        }, 3000);
    }
}
