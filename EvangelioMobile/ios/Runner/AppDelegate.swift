import Flutter
import UIKit

@main
@objc class AppDelegate: FlutterAppDelegate, FlutterImplicitEngineDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  func didInitializeImplicitFlutterEngine(_ engineBridge: FlutterImplicitEngineBridge) {
    GeneratedPluginRegistrant.register(with: engineBridge.pluginRegistry)
    let channel = FlutterEventChannel(
      name: "tumirada/oauth_links",
      binaryMessenger: engineBridge.applicationRegistrar.messenger()
    )
    channel.setStreamHandler(OauthLinkStreamHandler.shared)
  }

  override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    OauthLinkStreamHandler.shared.emit(url.absoluteString)
    return super.application(app, open: url, options: options)
  }
}

final class OauthLinkStreamHandler: NSObject, FlutterStreamHandler {
  static let shared = OauthLinkStreamHandler()
  private var sink: FlutterEventSink?
  private var pending: String?

  func emit(_ url: String) {
    if let sink {
      sink(url)
    } else {
      pending = url
    }
  }

  func onListen(withArguments arguments: Any?, eventSink events: @escaping FlutterEventSink) -> FlutterError? {
    sink = events
    if let pending {
      events(pending)
      self.pending = nil
    }
    return nil
  }

  func onCancel(withArguments arguments: Any?) -> FlutterError? {
    sink = nil
    return nil
  }
}
