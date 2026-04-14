package com.reelcreatormobile;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
import com.reactnativedocumentpicker.DocumentPickerPackage;
import com.rnfs.RNFSPackage;
import com.swmansion.gesturehandler.RNGestureHandlerPackage;
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
import com.brentvatne.react.ReactVideoPackage;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new AsyncStoragePackage(),
              new DocumentPickerPackage(),
              new RNFSPackage(),
              new RNGestureHandlerPackage(),
              new SafeAreaContextPackage(),
              new ReactVideoPackage());
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    CrashFileLogger.install(this);
    try {
      SoLoader.init(this, false);
      if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
        DefaultNewArchitectureEntryPoint.load();
      }
    } catch (Throwable startupError) {
      CrashFileLogger.logThrowable(this, "APPLICATION_ON_CREATE", startupError);
      throw startupError;
    }
  }
}
