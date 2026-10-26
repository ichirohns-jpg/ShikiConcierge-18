import UIKit
import PhotosUI
import ImageIO
import UniformTypeIdentifiers

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
    let composer = ComposerViewController()

    func application(_ application: UIApplication, didFinishLaunchingWithOptions options: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        window = UIWindow(frame: UIScreen.main.bounds)
        window?.rootViewController = UINavigationController(rootViewController: composer)
        window?.makeKeyAndVisible()
        if let url = options?[.url] as? URL { DispatchQueue.main.async { self.composer.receive(url) } }
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        guard url.scheme == "fujikoshare", url.host == "compose" else { return false }
        composer.receive(url)
        return true
    }
}

final class ComposerViewController: UIViewController, PHPickerViewControllerDelegate, UITextViewDelegate, UITextFieldDelegate {
    private let preview = UIImageView()
    private let body = UITextView()
    private let link = UITextField()
    private let status = UILabel()
    private let shareButton = UIButton(type: .system)
    private var image: UIImage?
    private var revision = UUID()
    private var importTask: Task<Void, Never>?
    private var copiedText: String?
    private let draftImage = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0].appendingPathComponent("draft.jpg")

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "ふじこ SNS投稿"
        view.backgroundColor = .systemBackground
        navigationItem.rightBarButtonItem = UIBarButtonItem(title: "消去", style: .plain, target: self, action: #selector(clearDraft))
        let scroll = UIScrollView()
        let stack = UIStackView()
        stack.axis = .vertical
        stack.spacing = 18
        scroll.translatesAutoresizingMaskIntoConstraints = false
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(scroll)
        scroll.addSubview(stack)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scroll.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor), scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            stack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor, constant: 20),
            stack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor, constant: -28),
            stack.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor, constant: -20),
            stack.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor, constant: -40)
        ])
        stack.addArrangedSubview(label("写真と文章を、そのままSNSへ", style: .title2))
        preview.contentMode = .scaleAspectFit
        preview.backgroundColor = .secondarySystemBackground
        preview.layer.cornerRadius = 14
        preview.clipsToBounds = true
        preview.heightAnchor.constraint(equalToConstant: 280).isActive = true
        preview.image = UIImage(systemName: "photo")
        preview.accessibilityLabel = "投稿する写真のプレビュー"
        stack.addArrangedSubview(preview)
        stack.addArrangedSubview(button("写真を選ぶ", action: #selector(pickPhoto)))
        stack.addArrangedSubview(label("投稿文", style: .headline))
        body.font = .preferredFont(forTextStyle: .body)
        body.adjustsFontForContentSizeCategory = true
        body.backgroundColor = .secondarySystemBackground
        body.layer.cornerRadius = 10
        body.heightAnchor.constraint(equalToConstant: 170).isActive = true
        body.accessibilityLabel = "投稿文"
        body.delegate = self
        stack.addArrangedSubview(body)
        stack.addArrangedSubview(label("DXの記事リンク", style: .headline))
        link.borderStyle = .roundedRect
        link.keyboardType = .URL
        link.autocorrectionType = .no
        link.autocapitalizationType = .none
        link.placeholder = "https://…"
        link.accessibilityLabel = "DXの記事リンク"
        link.font = .preferredFont(forTextStyle: .body)
        link.delegate = self
        link.addTarget(self, action: #selector(changed), for: .editingChanged)
        stack.addArrangedSubview(link)
        stack.addArrangedSubview(button("① 文章とDXリンクをコピー", action: #selector(copyCaption)))
        var config = UIButton.Configuration.filled()
        config.title = "② 画像をSNSへ共有"
        config.baseBackgroundColor = .systemTeal
        config.contentInsets = NSDirectionalEdgeInsets(top: 18, leading: 12, bottom: 18, trailing: 12)
        shareButton.configuration = config
        shareButton.addTarget(self, action: #selector(sharePhoto), for: .touchUpInside)
        stack.addArrangedSubview(shareButton)
        status.numberOfLines = 0
        status.font = .preferredFont(forTextStyle: .body)
        status.accessibilityTraits = .updatesFrequently
        stack.addArrangedSubview(status)
        stack.addArrangedSubview(label("SNSを選んだら、投稿欄に文章を貼り付けて確認してください。写真を押したときの動作はSNS側で決まります。", style: .footnote))
        body.text = UserDefaults.standard.string(forKey: "draft.body") ?? ""
        link.text = UserDefaults.standard.string(forKey: "draft.link") ?? ""
        if let data = try? Data(contentsOf: draftImage), let saved = Self.decode(data) { image = saved; preview.image = saved }
        refresh()
    }

    private func label(_ text: String, style: UIFont.TextStyle) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = .preferredFont(forTextStyle: style)
        label.adjustsFontForContentSizeCategory = true
        label.numberOfLines = 0
        return label
    }

    private func button(_ text: String, action: Selector) -> UIButton {
        let result = UIButton(type: .system)
        var config = UIButton.Configuration.filled()
        config.title = text
        config.baseBackgroundColor = .systemBlue
        config.contentInsets = NSDirectionalEdgeInsets(top: 18, leading: 12, bottom: 18, trailing: 12)
        result.configuration = config
        result.addTarget(self, action: action, for: .touchUpInside)
        return result
    }

    @objc private func pickPhoto() {
        view.endEditing(true)
        importTask?.cancel()
        revision = UUID()
        refresh()
        var config = PHPickerConfiguration(photoLibrary: .shared())
        config.filter = .images
        config.selectionLimit = 1
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        present(picker, animated: true)
    }

    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        picker.dismiss(animated: true)
        guard let provider = results.first?.itemProvider else { return }
        let token = UUID()
        revision = token
        shareButton.isEnabled = false
        status.text = "写真を読み込んでいます…"
        guard let type = provider.registeredTypeIdentifiers.first(where: { UTType($0)?.conforms(to: .image) == true }) else {
            status.text = "この写真形式を読み込めません。別の写真を選んでください。"; refresh(); return
        }
        provider.loadDataRepresentation(forTypeIdentifier: type) { [weak self] data, error in
            let photo = data.flatMap(Self.decode)
            DispatchQueue.main.async {
                guard let self = self, self.revision == token else { return }
                if let photo = photo { self.setPhoto(photo) }
                else { self.status.text = "写真を読み込めませんでした。もう一度選んでください。"; self.refresh() }
            }
        }
    }

    nonisolated private static func decode(_ data: Data) -> UIImage? {
        guard data.count <= 25_000_000, let source = CGImageSourceCreateWithData(data as CFData, nil),
              let cg = CGImageSourceCreateThumbnailAtIndex(source, 0, [
                kCGImageSourceCreateThumbnailFromImageAlways: true,
                kCGImageSourceCreateThumbnailWithTransform: true,
                kCGImageSourceThumbnailMaxPixelSize: 2400
              ] as CFDictionary) else { return nil }
        return UIImage(cgImage: cg)
    }

    private func setPhoto(_ photo: UIImage) {
        image = photo
        preview.image = photo
        do {
            try FileManager.default.createDirectory(at: draftImage.deletingLastPathComponent(), withIntermediateDirectories: true)
            guard let data = photo.jpegData(compressionQuality: 0.94) else { throw CocoaError(.fileWriteUnknown) }
            try data.write(to: draftImage, options: [.atomic, .completeFileProtection])
            status.text = "写真を用意しました。①から進めてください。"
        } catch { status.text = "写真は共有できますが、下書きの写真を保存できませんでした。" }
        refresh()
    }

    private func caption() -> String? {
        let raw = (link.text ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard let url = URL(string: raw), url.scheme?.lowercased() == "https", url.host != nil,
              url.user == nil, url.password == nil else {
            status.text = "DXの記事リンクを https:// から入力してください。"
            return nil
        }
        let text = body.text.trimmingCharacters(in: .whitespacesAndNewlines)
        return [text, raw].filter { !$0.isEmpty }.joined(separator: "\n\n")
    }

    @objc private func copyCaption() {
        view.endEditing(true)
        guard let text = caption() else { return }
        UIPasteboard.general.setItems([[UIPasteboard.typeAutomatic: text]], options: [.localOnly: true])
        copiedText = text
        status.text = "コピーしました。②を押してSNSを選び、投稿欄に貼り付けてください。"
        UIAccessibility.post(notification: .announcement, argument: status.text)
    }

    @objc private func sharePhoto() {
        view.endEditing(true)
        guard let photo = image, let text = caption() else { return }
        guard copiedText == text else { status.text = "先に①で最新の文章とリンクをコピーしてください。"; return }
        // URLカードに置き換えないため、共有するのは画像だけ。文章は利用者が貼り付ける。
        let sheet = UIActivityViewController(activityItems: [photo], applicationActivities: nil)
        sheet.popoverPresentationController?.sourceView = shareButton
        sheet.popoverPresentationController?.sourceRect = shareButton.bounds
        sheet.completionWithItemsHandler = { [weak self] _, completed, _, error in
            DispatchQueue.main.async {
                self?.status.text = error != nil ? "共有できませんでした。もう一度お試しください。" :
                    (completed ? "画像を共有先へ渡しました。SNSで文章を貼り付け、内容を確認してください。投稿完了はSNS側で確認してください。" : "共有を閉じました。下書きは残っています。")
            }
        }
        present(sheet, animated: true)
    }

    @objc private func changed() {
        UserDefaults.standard.set(body.text, forKey: "draft.body")
        UserDefaults.standard.set(link.text, forKey: "draft.link")
        copiedText = nil
    }
    func textViewDidChange(_ textView: UITextView) { changed() }
    private func refresh() { shareButton.isEnabled = image != nil }

    @objc private func clearDraft() {
        let confirm = UIAlertController(title: "下書きを消しますか？", message: "このアプリ内の写真・文章・リンクを消します。SNSの投稿は消えません。", preferredStyle: .alert)
        confirm.addAction(UIAlertAction(title: "残す", style: .cancel))
        confirm.addAction(UIAlertAction(title: "消す", style: .destructive) { [weak self] _ in
            guard let self = self else { return }
            self.importTask?.cancel(); self.revision = UUID()
            self.body.text = ""; self.link.text = ""; self.image = nil
            self.preview.image = UIImage(systemName: "photo")
            try? FileManager.default.removeItem(at: self.draftImage)
            self.changed(); self.refresh(); self.status.text = "下書きを消しました。"
        })
        present(confirm, animated: true)
    }

    // DX側が利用者の操作で開く: fujikoshare://compose?text=…&url=https%3A…&image=https%3A…
    // 外部からの受け取りだけ。SNSへの自動送信・自動コピーはしない。
    func receive(_ incoming: URL) {
        loadViewIfNeeded()
        guard incoming.scheme == "fujikoshare", incoming.host == "compose",
              let parts = URLComponents(url: incoming, resolvingAgainstBaseURL: false) else { return }
        func value(_ name: String) -> String? { parts.queryItems?.first { $0.name == name }?.value }
        let text = value("text") ?? ""
        let rawURL = value("url") ?? ""
        guard text.count <= 20_000, rawURL.count <= 4096 else { status.text = "受け取った記事が長すぎます。"; return }
        let prompt = UIAlertController(title: "DXの記事を読み込みますか？", message: "現在の下書きを置き換えます。読み込み後に内容を確認できます。", preferredStyle: .alert)
        prompt.addAction(UIAlertAction(title: "やめる", style: .cancel))
        prompt.addAction(UIAlertAction(title: "読み込む", style: .default) { [weak self] _ in
            guard let self = self else { return }
            self.importTask?.cancel(); self.revision = UUID()
            self.body.text = text; self.link.text = rawURL; self.image = nil
            self.preview.image = UIImage(systemName: "photo")
            try? FileManager.default.removeItem(at: self.draftImage)
            self.changed(); self.refresh()
            guard let rawImage = value("image"), let remote = URL(string: rawImage), remote.scheme == "https", remote.host != nil,
                  remote.user == nil, remote.password == nil else {
                self.status.text = "記事を読み込みました。写真を選んでください。"; return
            }
            let token = self.revision
            self.status.text = "記事の写真を読み込んでいます…"
            self.importTask = Task { @MainActor [weak self] in
                do {
                    var request = URLRequest(url: remote); request.timeoutInterval = 30
                    let (bytes, response) = try await URLSession.shared.bytes(for: request)
                    guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode),
                          http.url?.scheme == "https", (http.mimeType ?? "").hasPrefix("image/"),
                          http.expectedContentLength <= 25_000_000 else { throw URLError(.badServerResponse) }
                    var data = Data()
                    for try await byte in bytes {
                        try Task.checkCancellation()
                        guard data.count < 25_000_000 else { throw URLError(.dataLengthExceedsMaximum) }
                        data.append(byte)
                    }
                    try Task.checkCancellation()
                    guard let photo = Self.decode(data) else { throw URLError(.cannotDecodeContentData) }
                    guard let self = self, self.revision == token else { return }
                    self.setPhoto(photo)
                } catch {
                    guard let self = self, self.revision == token, !Task.isCancelled else { return }
                    self.status.text = "記事の写真を読み込めませんでした。写真を選んでください。"
                }
            }
        })
        guard presentedViewController == nil else { status.text = "開いている画面を閉じてから、もう一度DXの記事を送ってください。"; return }
        present(prompt, animated: true)
    }
}
