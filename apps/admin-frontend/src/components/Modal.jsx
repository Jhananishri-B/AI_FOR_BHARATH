import React from 'react'

const Modal = ({ title, children, onClose, footer }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg w-full max-w-lg">
        <div className="px-6 py-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="px-6 py-4 border-t border-slate-700 flex justify-end gap-2">
          {footer}
          <button className="px-3 py-2 bg-slate-600 rounded" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

export default Modal


