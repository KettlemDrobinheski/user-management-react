import { useEffect, useRef } from 'react'

export default function ConfirmationDialog({ message, action, returnFocus, onCancel, onConfirm }) {
  const dialog = useRef(null)
  const cancelButton = useRef(null)

  useEffect(() => {
    const element = dialog.current
    element.showModal()
    cancelButton.current.focus()
    return () => element.close()
  }, [])

  function finish(action) {
    dialog.current.close()
    returnFocus?.focus()
    return action()
  }

  return (
    <dialog
      ref={dialog}
      className="confirmation-dialog"
      aria-labelledby="confirmation-message"
      onCancel={(event) => {
        event.preventDefault()
        finish(onCancel)
      }}
    >
      <h2 id="confirmation-message">{message}</h2>
      <div className="confirmation-actions">
        <button type="button" ref={cancelButton} onClick={() => finish(onCancel)}>Cancelar</button>
        <button type="button" onClick={() => finish(onConfirm)}>{action}</button>
      </div>
    </dialog>
  )
}
