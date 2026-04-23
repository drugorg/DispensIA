//
//  ShareViewController.swift
//  DispensIAShare
//
//  Created by Francesco Rinaldi on 23/04/2026.
//

import UIKit
import Social

class ShareViewController: SLComposeServiceViewController {

    override func isContentValid() -> Bool {
        // Do validation of contentText and/or NSExtensionContext attachments here
        return true
    }

    override func didSelectPost() {
        guard
            let item = extensionContext?.inputItems.first as? NSExtensionItem,
            let attachment = item.attachments?.first
        else {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }

        if attachment.hasItemConformingToTypeIdentifier("public.movie") {
            attachment.loadItem(forTypeIdentifier: "public.movie", options: nil) { (data, error) in
                if let url = data as? URL {
                    let appGroupID = "group.com.dispensia.app"
                    if let containerURL = FileManager.default.containerURL(
                        forSecurityApplicationGroupIdentifier: appGroupID
                    ) {
                        let destinationURL = containerURL.appendingPathComponent("sharedVideo.mp4")
                        try? FileManager.default.copyItem(at: url, to: destinationURL)
                    }
                }
                self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            }
        } else {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
        }
    }

    override func configurationItems() -> [Any]! {
        // To add configuration options via table cells at the bottom of the sheet, return an array of SLComposeSheetConfigurationItem here.
        return []
    }

}
