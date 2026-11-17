package com.slp.billing;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

/**
 * SLP Billing — standalone Android wrapper for the shop's central billing server.
 *
 * First launch shows a one-time server-address setup screen (remembered in
 * SharedPreferences); every launch afterwards opens the billing app directly
 * in a full-screen WebView, outside any browser chrome.
 */
public class MainActivity extends Activity {

    private static final String PREFS = "slp_billing";
    private static final String KEY_URL = "server_url";
    private static final int REQ_FILE_CHOOSER = 1001;

    private WebView webView;
    private ProgressBar progressBar;
    private View errorOverlay;
    private TextView errorDetail;
    private View setupScreen;
    private EditText serverInput;
    private String serverUrl;
    private boolean errored = false;
    private ValueCallback<Uri[]> pendingFileCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = (WebView) findViewById(R.id.webview);
        progressBar = (ProgressBar) findViewById(R.id.progress);
        errorOverlay = findViewById(R.id.error_overlay);
        errorDetail = (TextView) findViewById(R.id.error_detail);
        setupScreen = findViewById(R.id.setup_screen);
        serverInput = (EditText) findViewById(R.id.server_input);

        Button saveBtn = (Button) findViewById(R.id.save_server);
        Button retryBtn = (Button) findViewById(R.id.retry_btn);
        Button changeBtn = (Button) findViewById(R.id.change_server_btn);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setSupportZoom(false);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        ws.setMediaPlaybackRequiresUserGesture(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();
                if (scheme.equals("http") || scheme.equals("https")) {
                    String host = uri.getHost();
                    Uri server = Uri.parse(serverUrl == null ? "" : serverUrl);
                    if (host != null && host.equals(server.getHost())) {
                        return false; // own server → stay in the app
                    }
                    openExternally(uri); // wa.me, shared links, other hosts
                    return true;
                }
                openExternally(uri); // tel:, mailto:, whatsapp:, upi:, geo:, intent:
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                errored = false;
                errorOverlay.setVisibility(View.GONE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                progressBar.setVisibility(View.GONE);
                if (!errored) {
                    errorOverlay.setVisibility(View.GONE);
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    CharSequence desc = error.getDescription();
                    showError(desc != null ? desc.toString() : "Network error");
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (errored) {
                    progressBar.setVisibility(View.GONE);
                    return;
                }
                progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
                progressBar.setProgress(newProgress);
            }

            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback,
                                             FileChooserParams params) {
                // photo capture / file inputs coming from the billing app
                if (pendingFileCallback != null) {
                    pendingFileCallback.onReceiveValue(null);
                }
                pendingFileCallback = callback;
                try {
                    Intent intent = params.createIntent();
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    startActivityForResult(intent, REQ_FILE_CHOOSER);
                    return true;
                } catch (Exception e) {
                    pendingFileCallback = null;
                    Toast.makeText(MainActivity.this, "No file picker available", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });

        saveBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                saveServer();
            }
        });
        retryBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                loadServer();
            }
        });
        changeBtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showSetup();
            }
        });

        SharedPreferences prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        serverUrl = prefs.getString(KEY_URL, null);
        if (serverUrl == null) {
            showSetup();
        } else {
            showMain();
            loadServer();
        }
    }

    private void showSetup() {
        setupScreen.setVisibility(View.VISIBLE);
        errorOverlay.setVisibility(View.GONE);
        if (serverInput.getText().toString().trim().isEmpty()) {
            serverInput.setText(serverUrl == null ? "http://" : serverUrl);
        }
        serverInput.requestFocus();
    }

    private void showMain() {
        setupScreen.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
    }

    private void saveServer() {
        String raw = serverInput.getText().toString().trim();
        if (raw.isEmpty() || raw.equals("http://") || raw.equals("https://")) {
            serverInput.setError("Enter the server address");
            return;
        }
        if (!raw.contains("://")) {
            raw = "http://" + raw;
        }
        Uri parsed = Uri.parse(raw);
        if (parsed.getHost() == null || parsed.getHost().trim().isEmpty()) {
            serverInput.setError("Invalid address");
            return;
        }
        if (raw.endsWith("/")) {
            raw = raw.substring(0, raw.length() - 1);
        }
        serverUrl = raw;
        getSharedPreferences(PREFS, MODE_PRIVATE)
                .edit().putString(KEY_URL, raw).apply();
        showMain();
        loadServer();
    }

    private void loadServer() {
        errored = false;
        errorOverlay.setVisibility(View.GONE);
        progressBar.setVisibility(View.VISIBLE);
        webView.loadUrl(serverUrl);
    }

    private void showError(String detail) {
        errored = true;
        progressBar.setVisibility(View.GONE);
        errorDetail.setText(detail);
        errorOverlay.setVisibility(View.VISIBLE);
    }

    private void openExternally(Uri uri) {
        try {
            Intent intent;
            if (uri.getScheme() != null && uri.getScheme().equals("intent")) {
                intent = Intent.parseUri(uri.toString(), Intent.URI_INTENT_SCHEME);
            } else {
                intent = new Intent(Intent.ACTION_VIEW, uri);
            }
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "No app can open this link", Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_FILE_CHOOSER) {
            if (pendingFileCallback != null) {
                pendingFileCallback.onReceiveValue(
                        WebChromeClient.FileChooserParams.parseResult(resultCode, data));
                pendingFileCallback = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView.getVisibility() == View.VISIBLE && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
