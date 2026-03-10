import React, { useState } from 'react'
import Modal from './Modal'

const CreateUserModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' })
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await onCreate(form)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Create New User" onClose={onClose} footer={
      <>
        <button className="px-3 py-2 bg-blue-600 rounded" onClick={submit} disabled={submitting}>
          {submitting ? 'Creating...' : 'Create'}
        </button>
      </>
    }>
      <form className="space-y-3" onSubmit={submit}>
        <input className="w-full bg-slate-700 rounded px-3 py-2" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        <input type="email" className="w-full bg-slate-700 rounded px-3 py-2" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
        <input type="password" className="w-full bg-slate-700 rounded px-3 py-2" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
        <select className="w-full bg-slate-700 rounded px-3 py-2" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
          <option value="student">student</option>
          <option value="admin">admin</option>
        </select>
      </form>
    </Modal>
  )
}

export default CreateUserModal


