# Creating a syntax highlighting template for XCode.

### 1 Copy the xclangspec to
The file should be named `NAME.xclangspec`.
```
/Applications/Xcode.app/Contents/SharedFrameworks/SourceModel.framework/Versions/A/Resources/LanguageSpecifications
```

### 2 Copy the metadata file to 
The file should be named `Xcode.SourceCodeLanguage.NAME.plist`.
```
/Applications/Xcode.app/Contents/SharedFrameworks/SourceModel.framework/Versions/A/Resources/LanguageMetadata
```

### Example project.
https://github.com/valentindusollier/LaTeX-for-Xcode

