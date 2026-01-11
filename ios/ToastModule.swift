@objc(NativeToast)
class NativeToast: NSObject {

  @objc(show:duration:position:)
  func show(message: String, duration: NSNumber, position: String) {
    DispatchQueue.main.async {
      guard let window = UIApplication.shared.windows.first else { return }

      let toast = UILabel()
      toast.text = message
      toast.textColor = .white
      toast.backgroundColor = UIColor.black.withAlphaComponent(0.85)
      toast.textAlignment = .center
      toast.numberOfLines = 0
      toast.layer.cornerRadius = 8
      toast.clipsToBounds = true

      let width = window.frame.width - 80
      let height: CGFloat = 50

      var y: CGFloat = 0

      switch position {
      case "top":
        y = 80
      case "center":
        y = (window.frame.height - height) / 2
      default: // bottom
        y = window.frame.height - 120
      }

      toast.frame = CGRect(
        x: 40,
        y: y,
        width: width,
        height: height
      )

      window.addSubview(toast)

      UIView.animate(
        withDuration: 0.5,
        delay: duration.doubleValue / 1000,
        options: .curveEaseOut,
        animations: { toast.alpha = 0 }
      ) { _ in
        toast.removeFromSuperview()
      }
    }
  }
}
