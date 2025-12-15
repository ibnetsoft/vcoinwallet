package com.threedvcoin.wallet;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Bridge;
import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int NOTIFICATION_PERMISSION_CODE = 1001;
    private String fcmToken = null;
    private Handler handler = new Handler(Looper.getMainLooper());
    private boolean tokenInjected = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            createNotificationChannel();
            requestNotificationPermission();

            // FCM 토큰 가져오기
            initFCM();

            // JavaScript Interface 추가 및 주기적 토큰 주입
            handler.postDelayed(this::setupWebViewAndInjectToken, 1000);
        } catch (Exception e) {
            Log.e(TAG, "Error in onCreate", e);
        }
    }

    private void setupWebViewAndInjectToken() {
        try {
            Bridge bridge = getBridge();
            if (bridge == null) {
                Log.d(TAG, "Bridge is null, retrying...");
                handler.postDelayed(this::setupWebViewAndInjectToken, 500);
                return;
            }

            WebView webView = bridge.getWebView();
            if (webView != null) {
                // JavaScript Interface 추가 - 웹에서 네이티브 호출 가능
                webView.addJavascriptInterface(new FCMInterface(), "AndroidFCM");
                Log.d(TAG, "JavaScript Interface 추가됨");

                // 주기적으로 토큰 주입 시도 (5초마다, 최대 12회 = 1분)
                startTokenInjection(webView);
            } else {
                // WebView가 아직 준비되지 않았으면 재시도
                handler.postDelayed(this::setupWebViewAndInjectToken, 500);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error setting up WebView", e);
            // Retry anyway
            handler.postDelayed(this::setupWebViewAndInjectToken, 1000);
        }
    }

    private void startTokenInjection(WebView webView) {
        final int[] attempts = { 0 };
        final int maxAttempts = 12;

        Runnable injectRunnable = new Runnable() {
            @Override
            public void run() {
                try {
                    if (tokenInjected || attempts[0] >= maxAttempts) {
                        Log.d(TAG, "토큰 주입 종료: injected=" + tokenInjected + ", attempts=" + attempts[0]);
                        return;
                    }

                    if (fcmToken != null) {
                        injectFCMToken(webView, fcmToken);
                        attempts[0]++;
                        Log.d(TAG, "토큰 주입 시도 #" + attempts[0]);
                    }

                    // 5초 후 재시도
                    handler.postDelayed(this, 5000);
                } catch (Exception e) {
                    Log.e(TAG, "Error in token injection loop", e);
                }
            }
        };

        // 3초 후 첫 시도 (페이지 로드 대기)
        handler.postDelayed(injectRunnable, 3000);
    }

    private void createNotificationChannel() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        "vcoin_notifications",
                        "V COIN 알림",
                        NotificationManager.IMPORTANCE_HIGH);
                channel.setDescription("V COIN 앱 알림 (새 회원 가입, 공지사항 등)");
                channel.enableVibration(true);
                channel.enableLights(true);
                channel.setShowBadge(true);

                NotificationManager notificationManager = getSystemService(NotificationManager.class);
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error creating notification channel", e);
        }
    }

    private void requestNotificationPermission() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (ContextCompat.checkSelfPermission(this,
                        Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(this,
                            new String[] { Manifest.permission.POST_NOTIFICATIONS },
                            NOTIFICATION_PERMISSION_CODE);
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error requesting permission", e);
        }
    }

    private void initFCM() {
        try {
            FirebaseMessaging.getInstance().getToken()
                    .addOnCompleteListener(task -> {
                        if (!task.isSuccessful()) {
                            Log.w(TAG, "FCM 토큰 가져오기 실패", task.getException());
                            return;
                        }

                        fcmToken = task.getResult();
                        Log.d(TAG, "FCM 토큰 획득: " + fcmToken);
                    });
        } catch (Exception e) {
            Log.e(TAG, "Error initializing FCM", e);
        }
    }

    private void injectFCMToken(WebView webView, String token) {
        if (webView == null)
            return;

        Log.d(TAG, "FCM 토큰 JavaScript로 주입 시도");

        // 토큰을 window 객체에 저장
        String script = "(function() {" +
                "  console.log('[Native] FCM 토큰 주입');" +
                "  try {" +
                "    window.NATIVE_FCM_TOKEN = '" + token + "';" +
                "    window.IS_NATIVE_APP = true;" +
                "    window.FCM_TOKEN = '" + token + "';" +
                "    " +
                "    // 콜백이 있으면 호출" +
                "    if (typeof window.onFCMToken === 'function') {" +
                "      console.log('[Native] onFCMToken 콜백 호출');" +
                "      try { window.onFCMToken('" + token + "'); } catch(e) { console.error(e); }" +
                "    }" +
                "    " +
                "    // 이벤트도 발생" +
                "    try {" +
                "      window.dispatchEvent(new CustomEvent('nativeFCMToken', { detail: '" + token + "' }));" +
                "    } catch(e) { console.error(e); }" +
                "    " +
                "    return 'injected';" +
                "  } catch(e) { console.error(e); return 'error'; }" +
                "})();";

        try {
            runOnUiThread(() -> {
                try {
                    webView.evaluateJavascript(script, result -> {
                        Log.d(TAG, "JavaScript 실행 결과: " + result);
                        if (result != null && result.contains("injected")) {
                            Log.d(TAG, "토큰 주입 성공!");
                        }
                    });
                } catch (Exception e) {
                    Log.e(TAG, "Error evaluating javascript", e);
                }
            });
        } catch (Exception e) {
            Log.e(TAG, "Error running on UI thread", e);
        }
    }

    // JavaScript Interface - 웹에서 호출 가능
    public class FCMInterface {
        @JavascriptInterface
        public String getFCMToken() {
            Log.d(TAG, "JavaScript에서 getFCMToken() 호출됨");
            return fcmToken != null ? fcmToken : "";
        }

        @JavascriptInterface
        public void tokenSaved() {
            Log.d(TAG, "JavaScript에서 tokenSaved() 호출됨 - 토큰 저장 완료");
            tokenInjected = true;
        }

        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }
}
