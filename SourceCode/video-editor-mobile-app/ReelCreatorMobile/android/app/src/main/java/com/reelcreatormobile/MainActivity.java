package com.reelcreatormobile;

import android.os.Bundle;
import com.facebook.react.ReactActivity;

public class MainActivity extends ReactActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    try {
      super.onCreate(savedInstanceState);
    } catch (Throwable startupError) {
      CrashFileLogger.logThrowable(this, "MAIN_ACTIVITY_ON_CREATE", startupError);
      throw startupError;
    }
  }

  @Override
  protected String getMainComponentName() {
    return "ReelCreatorMobile";
  }
}
