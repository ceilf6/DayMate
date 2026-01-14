# iOS 发布配置指南

## 当前配置信息

- **Bundle Identifier**: `com.daymate.rn`
- **Development Team ID**: `DPC95H58J8`
- **Display Name**: DayMate

## 前置要求

### 1. Apple Developer 账号

- 需要一个有效的 **Apple Developer Program** 账号（年费 $99 USD）
- 登录网址: [https://developer.apple.com](https://developer.apple.com/)

### 2. 开发环境

- macOS 系统
- 已安装 Xcode（最新版本）
- 已安装 CocoaPods

---

## iOS 发布流程

### 步骤 1: 创建 App Store Connect 应用

1. 登录 [App Store Connect](https://appstoreconnect.apple.com/)
2. 点击 "我的 App" → "+" → "新建 App"
3. 填写以下信息:
    - **平台**: iOS
    - **名称**: DayMate
    - **主要语言**: 选择中文或英文
    - **套装 ID**: 选择 `com.daymate.rn`
    - **SKU**: 自定义唯一标识符（例如: daymate-ios-2024）

### 步骤 2: 配置证书和描述文件

### 2.1 创建 iOS Distribution 证书

1. 打开 **钥匙串访问** (Keychain Access)
2. 菜单: 钥匙串访问 → 证书助理 → 从证书颁发机构请求证书
3. 填写信息:
    - 用户电子邮件: 您的邮箱
    - 常用名称: 您的名字
    - 选择 "存储到磁盘"
4. 保存为 `CertificateSigningRequest.certSigningRequest`
5. 登录 [Apple Developer](https://developer.apple.com/account/resources/certificates/list)
6. 点击 "Certificates" → "+" 创建新证书
7. 选择 **iOS Distribution (App Store and Ad Hoc)**
8. 上传刚才创建的 CSR 文件
9. 下载证书文件 (`.cer`)
10. 双击安装到钥匙串

### 2.2 创建 App Store Provisioning Profile

1. 在 [Apple Developer](https://developer.apple.com/account/resources/profiles/list) 中
2. 点击 "Profiles" → "+" 创建新描述文件
3. 选择 **App Store**
4. 选择 App ID: `com.daymate.rn`
5. 选择刚才创建的 Distribution 证书
6. 下载 `.mobileprovision` 文件
7. 双击安装

### 步骤 3: 在 Xcode 中配置签名

1. 打开 Xcode 工程:
    
    ```bash
    cd /Users/a86198/Desktop/DayMate/apps/rn-calendar/ios
    open DayMateRN.xcworkspace
    
    ```
    
2. 选择项目 `DayMateRN` → Target `DayMateRN` → "Signing & Capabilities"
3. **Release 配置**:
    - 取消勾选 "Automatically manage signing"
    - Team: 选择您的团队 (DPC95H58J8)
    - Provisioning Profile: 选择刚才创建的 App Store profile
    - Signing Certificate: 选择 "iOS Distribution"
4. 确认 Bundle Identifier 为 `com.daymate.rn`

### 步骤 4: 构建和导出 IPA

### 方法 1: 使用 npm 脚本（命令行）

```bash
# 清理构建缓存
npm run ios:clean

# 创建 Archive
npm run ios:archive

# 导出 IPA
npm run ios:export-ipa

```

生成的 IPA 文件位置: `ios/build/DayMateRN.ipa`

### 方法 2: 使用 Xcode（图形界面）

1. 打开 `DayMateRN.xcworkspace`
2. 选择 **Any iOS Device (arm64)** 作为目标设备
3. 菜单: Product → Archive
4. 等待归档完成后，在 Organizer 中:
    - 选择刚才的归档
    - 点击 "Distribute App"
    - 选择 "App Store Connect"
    - 选择 "Upload"
    - 按照向导完成上传

### 步骤 5: 上传到 App Store Connect

### 使用 Xcode 上传

按照"方法 2"的步骤，选择 Upload 即可自动上传。

### 使用 Transporter 上传

1. 从 Mac App Store 下载 "Transporter" 应用
2. 打开 Transporter，拖入生成的 `.ipa` 文件
3. 点击 "交付" 上传到 App Store Connect

### 步骤 6: 提交审核

1. 登录 [App Store Connect](https://appstoreconnect.apple.com/)
2. 选择您的 App → "App Store" 标签
3. 填写 App 信息:
    - App 预览和截图
    - 描述
    - 关键词
    - 支持 URL
    - 营销 URL（可选）
    - 隐私政策 URL
4. 在 "构建版本" 部分选择刚才上传的构建
5. 填写"版权"、"年龄分级"等信息
6. 提交审核

---

## 常见问题

### Q1: 如何测试 Release 版本？

A: 使用 Ad Hoc 分发:

1. 创建 Ad Hoc Provisioning Profile
2. 在 `exportOptions.plist` 中将 `method` 改为 `ad-hoc`
3. 添加测试设备的 UDID 到 Apple Developer
4. 重新导出 IPA，使用 iTunes 或 Xcode 安装到设备

### Q2: 签名错误怎么办？

A: 常见解决方法:

1. 确认证书和描述文件有效且未过期
2. 在 Xcode 中删除旧的描述文件，重新下载
3. 清理构建缓存: `npm run ios:clean`
4. 重启 Xcode

### Q3: 构建失败?

A: 检查:

1. CocoaPods 依赖是否正确安装: `npm run ios:pods`
2. Xcode 版本是否最新
3. 查看 Xcode 构建日志获取详细错误信息

---

## 快速参考

### 打包命令

```bash
# Android
npm run android:build-apk    # 生成 APK
npm run android:build-aab    # 生成 AAB (Google Play)

# iOS
npm run ios:clean           # 清理
npm run ios:archive         # 创建归档
npm run ios:export-ipa      # 导出 IPA

```

### 输出文件位置

- **Android APK**: `apps/rn-calendar/android/app/build/outputs/apk/release/app-release.apk`
- **Android AAB**: `apps/rn-calendar/android/app/build/outputs/bundle/release/app-release.aab`
- **iOS IPA**: `apps/rn-calendar/ios/build/DayMateRN.ipa`

---

## 注意事项

1. **保护证书**: iOS Distribution 证书非常重要，建议:
    - 导出 `.p12` 文件备份（钥匙串访问 → 导出）
    - 设置强密码
    - 安全存储
2. **版本号管理**:
    - Android: 修改 `android/app/build.gradle` 中的 `versionCode` 和 `versionName`
    - iOS: 在 Xcode 中修改 "Version" 和 "Build" 号
3. **隐私权限**:
    - 确保 `Info.plist` 中的权限描述清晰
    - 当前已配置: 照片库访问权限
4. **App Store 审核准备**:
    - 准备至少 5 张不同尺寸的截图
    - 准备详细的 App 描述
    - 确保遵守 App Store 审核指南

---

如有问题，请参考:

- [Apple Developer Documentation](https://developer.apple.com/documentation/)
- [React Native Publishing Guide](https://reactnative.dev/docs/publishing-to-app-store)