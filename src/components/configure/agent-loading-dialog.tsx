import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type AgentUpdateStatus = "idle" | "updating" | "ready" | "failed"

type AgentLoadingDialogProps = {
  open: boolean
  status: AgentUpdateStatus
  onClose: () => void
}

const QUOTES = [
  "MAGI System coming online...",
  "Melchior is calibrating neural pathways...",
  "Balthasar is synchronizing knowledge base...",
  "Casper is updating inference model...",
  "Validating agent instructions...",
  "Running synchronization protocols...",
  "Agent consensus algorithm engaged...",
  "Preparing deployment manifest...",
  "Cross-referencing instruction sets...",
  "Finalizing model configuration...",
]

export function AgentLoadingDialog({ open, status, onClose }: AgentLoadingDialogProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  // Rotate quotes with a fade effect while updating
  useEffect(() => {
    if (status !== "updating") return

    const interval = setInterval(() => {
      // Fade out
      setVisible(false)
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length)
        // Fade back in
        setVisible(true)
      }, 300)
    }, 3000)

    return () => clearInterval(interval)
  }, [status])

  // Reset quote index when dialog opens
  useEffect(() => {
    if (open) {
      setQuoteIndex(0)
      setVisible(true)
    }
  }, [open])

  // Auto-close 2 seconds after agents are ready
  useEffect(() => {
    if (status !== "ready") return
    const timer = setTimeout(onClose, 2000)
    return () => clearTimeout(timer)
  }, [status, onClose])

  const isUpdating = status === "updating"
  const isReady = status === "ready"
  const isFailed = status === "failed"

  return (
    <Dialog open={open} onOpenChange={isFailed ? onClose : undefined}>
      <DialogContent
        showCloseButton={isFailed}
        className="sm:max-w-md"
        // Prevent closing on outside click or Escape while updating or in success state
        onInteractOutside={(e) => { if (!isFailed) e.preventDefault() }}
        onEscapeKeyDown={(e) => { if (!isFailed) e.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle>
            {isReady ? "MAGI System Ready" : isFailed ? "Update Failed" : "Updating MAGI System"}
          </DialogTitle>
          <DialogDescription>
            {isReady
              ? "All agents have been configured and are ready to use."
              : isFailed
              ? "One or more agents could not be prepared. Your configuration was saved and will be retried on next save."
              : "Your configuration is being applied to the Bedrock agents. This may take a minute."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          {isUpdating && (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p
                className="text-center text-sm text-muted-foreground transition-opacity duration-300"
                style={{ opacity: visible ? 1 : 0 }}
              >
                {QUOTES[quoteIndex]}
              </p>
            </>
          )}

          {isReady && (
            <>
              <CheckCircle2 className="h-10 w-10 text-green-500" />
              <p className="text-center text-sm text-muted-foreground">
                All agents are ready. Closing...
              </p>
            </>
          )}

          {isFailed && (
            <>
              <XCircle className="h-10 w-10 text-destructive" />
              <p className="text-center text-sm text-muted-foreground">
                Check CloudWatch logs for details.
              </p>
            </>
          )}
        </div>

        {isFailed && (
          <DialogFooter showCloseButton>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
