module.exports = {
  dependencies: {
    "react-native-document-picker": {
      platforms: {
        android: {
          packageImportPath: "import com.reactnativedocumentpicker.DocumentPickerPackage;",
          packageInstance: "new DocumentPickerPackage()"
        }
      }
    }
  }
};
