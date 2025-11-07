"use client"

import { useState } from "react"
import { X, Mail, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { FilterState } from "./filter-drawer"

interface SaveFilterDialogProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onSave: (name: string, emailEnabled: boolean, emailRecipients: string[]) => void
}

export function SaveFilterDialog({ isOpen, onClose, filters, onSave }: SaveFilterDialogProps) {
  const [name, setName] = useState("")
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailRecipients, setEmailRecipients] = useState("")
  const [error, setError] = useState("")

  function handleSave() {
    if (!name.trim()) {
      setError("Please enter a name for this filter")
      return
    }

    if (emailEnabled && !emailRecipients.trim()) {
      setError("Please enter at least one email recipient")
      return
    }

    const recipients = emailEnabled
      ? emailRecipients
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e)
      : []

    onSave(name.trim(), emailEnabled, recipients)
    handleClose()
  }

  function handleClose() {
    setName("")
    setEmailEnabled(false)
    setEmailRecipients("")
    setError("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/50" onClick={handleClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Save Filter</h2>
          </div>
          <button type="button" onClick={handleClose} className="rounded-md p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Filter Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="e.g., High Value Inventory"
              className="h-10 w-full rounded border bg-background px-3 text-sm"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="email-enabled"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="h-4 w-4"
            />
            <label htmlFor="email-enabled" className="text-sm font-medium">
              Send email report
            </label>
          </div>

          {emailEnabled && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                <Mail className="inline h-4 w-4 mr-1" />
                Email Recipients
              </label>
              <input
                type="text"
                value={emailRecipients}
                onChange={(e) => {
                  setEmailRecipients(e.target.value)
                  setError("")
                }}
                placeholder="email1@example.com, email2@example.com"
                className="h-10 w-full rounded border bg-background px-3 text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">Separate multiple emails with commas</p>
            </div>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t p-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Filter
          </Button>
        </div>
      </div>
    </>
  )
}
