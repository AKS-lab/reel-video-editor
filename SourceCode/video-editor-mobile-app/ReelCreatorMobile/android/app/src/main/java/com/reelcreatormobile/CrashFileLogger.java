package com.reelcreatormobile;

import android.app.Application;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public final class CrashFileLogger {
  private static final String TAG = "ReelCrashLogger";
  private static final String INTERNAL_LOG_FILE = "reelcreator-crash.log";
  private static final String CRASH_DIR = "ReelCreator";

  private CrashFileLogger() {}

  public static void install(Application application) {
    final Thread.UncaughtExceptionHandler previousHandler = Thread.getDefaultUncaughtExceptionHandler();
    Thread.setDefaultUncaughtExceptionHandler(
        (thread, throwable) -> {
          logThrowable(application, "UNCAUGHT_EXCEPTION", throwable);
          if (previousHandler != null) {
            previousHandler.uncaughtException(thread, throwable);
          }
        });
  }

  public static void logThrowable(Context context, String stage, Throwable throwable) {
    if (throwable == null) {
      return;
    }
    final String payload = buildPayload(stage, throwable);
    appendInternalLog(context, payload);
    writePublicDownloadsLog(context, payload);
    Log.e(TAG, payload);
  }

  private static String buildPayload(String stage, Throwable throwable) {
    StringWriter stackWriter = new StringWriter();
    PrintWriter printer = new PrintWriter(stackWriter);
    throwable.printStackTrace(printer);
    printer.flush();

    String timestamp =
        new SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(new Date(System.currentTimeMillis()));
    return "timestamp=" + timestamp + "\n"
        + "stage=" + stage + "\n"
        + "thread=" + Thread.currentThread().getName() + "\n"
        + "android_sdk=" + Build.VERSION.SDK_INT + "\n"
        + "stacktrace=\n"
        + stackWriter
        + "\n---\n";
  }

  private static void appendInternalLog(Context context, String payload) {
    FileWriter writer = null;
    try {
      File file = new File(context.getFilesDir(), INTERNAL_LOG_FILE);
      writer = new FileWriter(file, true);
      writer.write(payload);
      writer.flush();
    } catch (Exception error) {
      Log.e(TAG, "Failed to append internal crash log.", error);
    } finally {
      if (writer != null) {
        try {
          writer.close();
        } catch (Exception closeError) {
          Log.e(TAG, "Failed to close internal crash log writer.", closeError);
        }
      }
    }
  }

  private static void writePublicDownloadsLog(Context context, String payload) {
    final String fileName =
        "reelcreator-crash-"
            + new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(new Date(System.currentTimeMillis()))
            + ".log";

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      ContentResolver resolver = context.getContentResolver();
      ContentValues values = new ContentValues();
      values.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
      values.put(MediaStore.MediaColumns.MIME_TYPE, "text/plain");
      values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/" + CRASH_DIR);

      OutputStream stream = null;
      try {
        Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
        if (uri == null) {
          return;
        }
        stream = resolver.openOutputStream(uri);
        if (stream == null) {
          return;
        }
        stream.write(payload.getBytes());
        stream.flush();
      } catch (Exception error) {
        Log.e(TAG, "Failed to write crash log into Downloads.", error);
      } finally {
        if (stream != null) {
          try {
            stream.close();
          } catch (Exception closeError) {
            Log.e(TAG, "Failed to close downloads crash log stream.", closeError);
          }
        }
      }
      return;
    }

    FileOutputStream stream = null;
    try {
      File downloadRoot = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
      File crashDir = new File(downloadRoot, CRASH_DIR);
      if (!crashDir.exists() && !crashDir.mkdirs()) {
        return;
      }
      File output = new File(crashDir, fileName);
      stream = new FileOutputStream(output);
      stream.write(payload.getBytes());
      stream.flush();
    } catch (Exception error) {
      Log.e(TAG, "Failed to write legacy downloads crash log.", error);
    } finally {
      if (stream != null) {
        try {
          stream.close();
        } catch (Exception closeError) {
          Log.e(TAG, "Failed to close legacy crash log stream.", closeError);
        }
      }
    }
  }
}
