# Step 2 Project Setup

## What you are building

Two runnable project shells:

- Web: static Vanilla JS app (`index.html`, `style.css`, `app.js`)
- Mobile: React Native CLI + TypeScript app with Android debug/release APK configuration

## Folder structure

```text
SourceCode/
├── video-editor-web-app/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   └── README.md
└── video-editor-mobile-app/
    └── ReelCreatorMobile/
        ├── package.json
        ├── app.json
        ├── index.js
        ├── babel.config.js
        ├── metro.config.js
        ├── tsconfig.json
        ├── src/
        │   └── App.tsx
        ├── README.md
        └── android/
            ├── build.gradle
            ├── settings.gradle
            ├── gradle.properties
            ├── local.properties.example
            └── app/
                ├── build.gradle
                ├── proguard-rules.pro
                └── src/main/
                    ├── AndroidManifest.xml
                    ├── java/com/reelcreatormobile/
                    │   ├── MainActivity.java
                    │   └── MainApplication.java
                    └── res/values/
                        ├── strings.xml
                        └── styles.xml
```

## Dependencies

- Web: none (Vanilla JS static files)
- Mobile:
  - `react`
  - `react-native`
  - `typescript`
  - RN Babel/Metro toolchain

## Environment notes

- `unsure`: local machine currently reports missing Java runtime and older Node for latest RN CLI init.
- This scaffold is created to satisfy structure and build config requirements, but actual APK build requires local Android/JDK setup.
