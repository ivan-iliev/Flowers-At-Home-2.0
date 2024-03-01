package com.example.botnaicawellnes

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.content.pm.ActivityInfo
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.annotation.Keep
import androidx.annotation.MainThread
import androidx.webkit.WebViewAssetLoader
import com.example.botnaicawellnes.databinding.LayoutBinding

class MainActivity : Activity() {

	private lateinit var binding: LayoutBinding
	private lateinit var webView: WebView

    private var uploadMessage: ValueCallback<Array<Uri?>?>?= null
    private val assetLoader: WebViewAssetLoader = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()

    internal companion object{
        private const val TAG= "MainActivity"
        private const val returnCode= 1
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, intent: Intent?){
        super.onActivityResult(requestCode, resultCode, intent)
        var results: Array<Uri?>?= null
        if( resultCode==RESULT_OK && requestCode==returnCode ){
            if( uploadMessage==null )
                return
            results= WebChromeClient.FileChooserParams.parseResult(resultCode, intent)
        }
        uploadMessage?.onReceiveValue(results)
        uploadMessage= null
    }

    @Keep
    @JavascriptInterface
    fun test(){ Log.i(TAG, "test") }
    @Keep
    @JavascriptInterface
    fun forceOrientation(portrait: Boolean){
        requestedOrientation= (if( portrait ) ActivityInfo.SCREEN_ORIENTATION_SENSOR_PORTRAIT else ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE)
    }
	@Keep @JavascriptInterface
	fun exit(){ finish() }



    @SuppressLint("JavascriptInterface", "SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        //setContentView(R.layout.layout)

        binding= LayoutBinding.inflate(layoutInflater)
        setContentView(binding.root)
        webView= binding.webview



        webView.settings.allowFileAccess= true
        webView.settings.allowContentAccess= true
        webView.settings.javaScriptEnabled= true
        webView.settings.mixedContentMode= MIXED_CONTENT_ALWAYS_ALLOW


        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        webView.addJavascriptInterface(this, "system")
        webView.loadUrl("https://www.botanica-wellness.com/assets/index.html")
        webView.webChromeClient= object: WebChromeClient(){
            override fun onShowFileChooser(mWebView: WebView?, filePathCallback: ValueCallback<Array<Uri?>?>, fileChooserParams: FileChooserParams): Boolean{//For Lollipop 5.0+ Devices
                uploadMessage?.onReceiveValue(null)
                uploadMessage= filePathCallback

                val intent= fileChooserParams.createIntent()
                try{
                    startActivityForResult(intent, returnCode)
                }catch(e: ActivityNotFoundException){
                    uploadMessage= null
                    Toast.makeText(this@MainActivity.applicationContext, "Cannot Open File Chooser", Toast.LENGTH_LONG).show()
                    return false
                }
                return true
            }

            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean{
                consoleMessage?.apply{
                    val msg= "] \"" +message() +"\", source: " +sourceId() +":" +lineNumber()
                    @Suppress("WHEN_ENUM_CAN_BE_NULL_IN_JAVA") when( messageLevel() ){
                        ConsoleMessage.MessageLevel.ERROR /*error*/-> Log.e(TAG, "[WEBVIEW.CONSOLE.ERROR$msg")
                        ConsoleMessage.MessageLevel.WARNING/*warn*/-> Log.w(TAG, "[WEBVIEW.CONSOLE.WARN$msg" )
                        ConsoleMessage.MessageLevel.LOG    /*info*/-> Log.i(TAG, "[WEBVIEW.CONSOLE.INFO$msg" )
                        ConsoleMessage.MessageLevel.DEBUG /*debug*/-> Log.d(TAG, "[WEBVIEW.CONSOLE.DEBUG$msg")
                        ConsoleMessage.MessageLevel.TIP     /*log*/-> Log.v(TAG, "[WEBVIEW.CONSOLE.LOG$msg"  )
                    }
                }
                return true
            }
    
        }

        webView.webViewClient= object: WebViewClient(){
            override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest): WebResourceResponse?= assetLoader.shouldInterceptRequest(Uri.parse(request.url.toString().replace("https://www.botanica-wellness.com/assets/", "https://appassets.androidplatform.net/assets/")))
        }

    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean{
        val keyCode= event.keyCode
        Log.d(TAG, "dispatchKeyEvent: scanCode= " +event.scanCode +", keyCode= $keyCode, action= " +event.action +", ACTION_DOWN= " +KeyEvent.ACTION_DOWN)
        if( event.action==KeyEvent.ACTION_DOWN ){
            when( keyCode ){
				KeyEvent.KEYCODE_BACK-> {webView.evaluateJavascript("input.inputHandler(backKey)", null); return true}
				KeyEvent.KEYCODE_ENTER-> {webView.evaluateJavascript("input.inputHandler(okKey)", null); return true}
            }
        }
        return super.dispatchKeyEvent(event)
    }
}
