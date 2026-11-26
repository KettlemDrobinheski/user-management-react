import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css'
import UserCard from './components/UserCard'
import ConfirmationDialog from './components/ConfirmationDialog'
import usersData from 'users-data'
import { validateCPF } from './utils/validateCPF';
import { validateAge } from './utils/validateAge';
import { validateEmail } from './utils/validateEmail';
import { formatCep, validateCep } from './utils/validateCep'
import { Toaster, toast } from 'react-hot-toast';

const isDemo = import.meta.env.MODE === 'demo'
const { listUsers, createUser, updateUser, removeUser } = usersData

function App() {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('')
  const [cep, setCep] = useState('')
  const [rua, setRua] = useState('')
  const [numero, setNumero] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [cepStatus, setCepStatus] = useState('idle')
  const cepRequest = useRef({ value: '', controller: null })
  const operation = useRef(null)
  const listHeading = useRef(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [mutation, setMutation] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [festa, setFesta] = useState(false)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [users, setUsers] = useState(() => {
    if (isDemo) return []

    const savedUsers = localStorage.getItem('users')

    return savedUsers ? JSON.parse(savedUsers) : []
  });
  
  const filteredUsers = users.filter((user) =>
  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.email.toLowerCase().includes(searchTerm.toLowerCase())
)


  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (!isDemo) {
      localStorage.setItem('users', JSON.stringify(users))
    }
  }, [users])

  const carregarUsuarios = useCallback(() => {
    if (operation.current) return
    operation.current = 'load'
    listUsers()
      .then((loadedUsers) => {
        setUsers(loadedUsers)
        setLoadError('')
      })
      .catch((erro) => {
        console.error(erro)
        const message = isDemo ? erro.message : 'Não foi possível carregar os usuários'
        setLoadError(message)
        toast.error(message)
      })
      .finally(() => {
        operation.current = null
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    carregarUsuarios()
  }, [carregarUsuarios])

  useEffect(() => {
    const request = cepRequest.current
    return () => request.controller?.abort()
  }, [])

  function retryLoad() {
    if (operation.current) return
    setLoading(true)
    carregarUsuarios()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (operation.current || confirmation) return

    const errors = {}
    if (!name.trim()) errors.name = 'Informe o nome.'
    else if (!/^[A-Za-zÀ-ÿ\s]+$/.test(name)) errors.name = 'Digite um nome válido'
    if (!cpf || !validateCPF(cpf)) errors.cpf = 'Digite um CPF válido'
    if (!email || !validateEmail(email)) errors.email = 'Digite um e-mail válido'
    if (!validateAge(age)) errors.age = 'Você deve ter pelo menos 18 anos'
    if (!validateCep(cep)) errors.cep = 'Digite um CEP válido com oito dígitos'
    else if (cepStatus === 'not-found') errors.cep = 'CEP não encontrado'
    else if (cepStatus === 'pending') errors.cep = 'Aguarde a consulta do CEP.'

    if (cepStatus !== 'pending') {
      if (!String(rua).trim()) errors.rua = 'Informe a rua.'
      if (!String(numero).trim()) errors.numero = 'Informe o número.'
      if (!String(bairro).trim()) errors.bairro = 'Informe o bairro.'
      if (!String(cidade).trim()) errors.cidade = 'Informe a cidade.'
      if (!/^[A-Za-z]{2}$/.test(String(estado).trim())) errors.estado = 'Informe a UF com duas letras.'
    }

    const otherUsers = users.filter((user) => user.id !== editingUser?.id)
    if (!errors.name && otherUsers.some((user) => user.name.toLowerCase() === name.toLowerCase())) {
      errors.name = 'Esse nome já está cadastrado'
    }
    if (!errors.cpf && otherUsers.some((user) => user.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''))) {
      errors.cpf = 'Esse CPF já está cadastrado'
    }
    if (!errors.email && otherUsers.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
      errors.email = 'Esse email já está cadastrado'
    }

    setFieldErrors(errors)
    const firstError = Object.keys(errors)[0]
    if (firstError) {
      event.currentTarget?.elements.namedItem(firstError)?.focus()
      toast.error(errors[firstError])
      return
    }

    const userData = { name, cpf, email, age, cep, rua, numero, bairro, cidade, estado }
    operation.current = 'save'
    setSaving(true)
    try {
      if (editingUser) {
        const updatedUser = await updateUser(editingUser.id, userData)
        setUsers((current) => current.map((user) => user.id === updatedUser.id ? updatedUser : user))
        setEditingUser(null)
        toast.success('Usuário atualizado com sucesso!')
      } else {
        const createdUser = await createUser(userData)
        setUsers((current) => [...current, createdUser])
        toast.success('Usuário cadastrado com sucesso!')
        setFesta(true)
        setTimeout(() => setFesta(false), 3000)
      }
      clearForm()
    } catch (erro) {
      console.error(erro)
      toast.error(erro.message || (editingUser ? 'Erro ao atualizar usuário' : 'Erro ao cadastrar usuário'))
    } finally {
      operation.current = null
      setSaving(false)
    }
  }

  function clearForm() {
    setFieldErrors({})
    setName('')
    setCpf('')
    setEmail('')
    setAge('')
    setFormCep('')
    setRua('')
    setNumero('')
    setBairro('')
    setCidade('')
    setEstado('')
  }

  function cancelEditing() {
    setEditingUser(null)
    clearForm()
  }

  async function resetDemo() {
    try {
      setUsers(await usersData.resetUsers())
      setLoadError('')
      setEditingUser(null)
      clearForm()
      setSearch('')
      setSearchTerm('')
      toast.success('Dados da demonstração redefinidos.')
    } catch (erro) {
      toast.error(erro.message)
    }
  }

  async function deleteUser({ id }) {
    try {
      await removeUser(id)

      setUsers((usuariosAtuais) =>
        usuariosAtuais.filter((user) => user.id !== id)
      )

      if (editingUser?.id === id) cancelEditing()
      toast.success("Usuário removido com sucesso!")
      listHeading.current?.focus()
    } catch (erro) {
      toast.error(erro.message || 'Erro ao excluir usuário')
    }
  }

  function requestConfirmation(type, trigger, user) {
    if (operation.current || confirmation) return
    setConfirmation({ type, trigger, user })
  }

  async function confirmOperation() {
    if (!confirmation || operation.current) return
    operation.current = confirmation.type
    setConfirmation(null)
    setMutation(true)
    try {
      if (confirmation.type === 'reset') await resetDemo()
      else await deleteUser(confirmation.user)
    } finally {
      operation.current = null
      setMutation(false)
    }
  }

  function editUser(user) {
    if (operation.current) return
    setFieldErrors({})
    setEditingUser(user);
    
    setName(user.name ?? '')
    setCpf(user.cpf ?? '')
    setEmail(user.email ?? '')
    setAge(user.age ?? '')
    setFormCep(user.cep ?? '')
    setRua(user.rua ?? '')
    setNumero(user.numero ?? '')
    setBairro(user.bairro ?? '')
    setCidade(user.cidade ?? '')
    setEstado(user.estado ?? '')
  }

  function formatCpf(value) {
    return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
  }



  function setFormCep(value) {
    const request = cepRequest.current
    request.controller?.abort()
    request.controller = null
    request.value = value
    setCep(value)
    setCepStatus('idle')
  }

  function handleCepChange(input) {
    const value = formatCep(input)
    if (value === cepRequest.current.value) return

    setFormCep(value)
    setRua('')
    setBairro('')
    setCidade('')
    setEstado('')
    if (validateCep(value)) buscarCep(value)
  }

  function changeField(field, onChange, event) {
    if (fieldErrors[field]) setFieldErrors({ ...fieldErrors, [field]: undefined })
    onChange(event.target.value)
  }

  async function buscarCep(value) {
    const request = cepRequest.current
    const controller = new AbortController()
    request.controller = controller
    setCepStatus('pending')

    const isCurrent = () => request.value === value &&
      request.controller === controller && !controller.signal.aborted

    try {
      const timeout = AbortSignal.timeout(8000)
      const response = await fetch(`https://viacep.com.br/ws/${value.replace('-', '')}/json/`, {
        signal: AbortSignal.any([controller.signal, timeout])
      })
      if (!response.ok) throw new Error('ViaCEP indisponível')
      const address = await response.json()
      if (!isCurrent()) return
      if (timeout.aborted) throw new Error('ViaCEP indisponível')

      if (address.erro) {
        setCepStatus('not-found')
        toast.error('CEP não encontrado')
        return
      }

      if (!validateCep(address.cep) || address.cep.replace('-', '') !== value.replace('-', '')) {
        throw new Error('CEP da resposta diferente do solicitado')
      }

      setRua(address.logradouro ?? '')
      setBairro(address.bairro ?? '')
      setCidade(address.localidade ?? '')
      setEstado(address.uf ?? '')
      setCepStatus('idle')
    } catch {
      if (!isCurrent()) return
      setCepStatus('unavailable')
      toast.error('Não foi possível consultar o CEP. Preencha o endereço manualmente.')
    }
  }

  function handleSearch(event) {
    event.preventDefault()
    setSearchTerm(search)
  }

  const busy = loading || saving || mutation
  const fields = [
    { id: 'name', label: 'Nome', value: name, change: setName },
    { id: 'cpf', label: 'CPF', value: cpf, change: (value) => setCpf(formatCpf(value)), inputMode: 'numeric' },
    { id: 'email', label: 'Email', value: email, change: setEmail, type: 'email' },
    { id: 'age', label: 'Idade', value: age, change: setAge, type: 'number' },
    { id: 'cep', label: 'CEP', value: cep, change: handleCepChange, inputMode: 'numeric' },
    { id: 'rua', label: 'Rua', value: rua, change: setRua, addressLookup: true },
    { id: 'numero', label: 'Número', value: numero, change: setNumero },
    { id: 'bairro', label: 'Bairro', value: bairro, change: setBairro, addressLookup: true },
    { id: 'cidade', label: 'Cidade', value: cidade, change: setCidade, addressLookup: true },
    { id: 'estado', label: 'Estado', value: estado, change: setEstado, addressLookup: true }
  ]

  return (
    <>
      <Toaster 
      position="top-right"
      reverseOrder={false}
      />

    <div className="App">

    {festa && (
  <div className="festa" aria-hidden="true">
    <span>🎈</span>
    <span>🎈</span>
    <span>🎈</span>
    <span>🎉</span>
    <span>🎊</span>
    <span>🎈</span>
    <span>🎉</span>
  </div>
)}

      <h1>Cadastro de Usuários</h1>

      {isDemo && (
        <section aria-label="Modo Demonstração" className="demo-notice">
          <p><strong>Modo Demonstração</strong></p>
          <p>Os cadastros ficam neste navegador. Use apenas informações fictícias.</p>
          <button type="button" aria-disabled={busy} onClick={(event) => requestConfirmation('reset', event.currentTarget)}>
            Redefinir dados da demonstração
          </button>
        </section>
      )}

      <p>Total de Usuarios: {users.length}</p>

      <form className="user-form" onSubmit={handleSubmit} noValidate>
        {fields.map(({ id, label, value, change, type = 'text', inputMode, addressLookup }) => {
          const error = id === 'cep' && cepStatus === 'not-found' ? 'CEP não encontrado' : fieldErrors[id]
          const hint = id === 'cep' && (cepStatus === 'pending' || cepStatus === 'unavailable')
          return (
            <div className="form-field" key={id}>
              <label htmlFor={id}>{label}</label>
              <input
                id={id}
                name={id}
                type={type}
                inputMode={inputMode}
                required
                placeholder={label}
                value={value}
                readOnly={saving || Boolean(addressLookup && cepStatus === 'pending')}
                aria-invalid={error ? true : undefined}
                aria-describedby={[error && id + '-error', hint && 'cep-status'].filter(Boolean).join(' ') || undefined}
                onChange={(event) => changeField(id, change, event)}
              />
              {error && <p id={id + '-error'} className="field-error">{error}</p>}
              {hint && (
                <p id="cep-status" role="status">
                  {cepStatus === 'pending' ? 'Consultando CEP…' : 'Preencha o endereço manualmente.'}
                </p>
              )}
            </div>
          )
        })}

        <div className="search-container" role="search">
          <label htmlFor="user-search">Pesquisar usuário</label>
          <div className="search-controls">
            <input
              id="user-search"
              type="search"
              placeholder="Pesquisar usuário..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') handleSearch(event) }}
            />
            <button type="button" onClick={handleSearch} aria-label="Pesquisar usuários">🔍</button>
          </div>
        </div>

        <button type="submit" aria-disabled={busy}>
          {saving ? (editingUser ? 'Atualizando…' : 'Cadastrando…') : editingUser ? 'Atualizar' : 'Cadastrar'}
        </button>

        {editingUser && (
          <button type="button" aria-disabled={busy} onClick={() => { if (!operation.current) cancelEditing() }}>
            Cancelar Edição
          </button>
        )}
      </form>

      <section className="user-list" aria-labelledby="user-list-heading">
        <h2 id="user-list-heading" ref={listHeading} tabIndex={-1}>Usuários</h2>
        <p role="status">
          {loading ? 'Carregando usuários…'
            : mutation ? 'Atualizando a lista de usuários…'
            : !loadError && users.length === 0 ? 'Nenhum usuário cadastrado.'
            : !loadError && filteredUsers.length === 0 ? 'Nenhum usuário encontrado para esta busca.'
            : ''}
        </p>
        {loadError && (
          <div>
            <p role="alert">{loadError}</p>
            <button type="button" aria-disabled={busy} onClick={retryLoad}>Tentar novamente</button>
          </div>
        )}
        <div className="user-cards" aria-busy={loading || mutation}>
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              busy={busy}
              onDelete={(selected, trigger) => requestConfirmation('delete', trigger, selected)}
              onEdit={editUser}
            />
          ))}
        </div>
      </section>

      {confirmation && (
        <ConfirmationDialog
          message={confirmation.type === 'reset'
            ? 'Redefinir os dados da demonstração e restaurar os exemplos iniciais?'
            : 'Excluir o usuário ' + confirmation.user.name + '?'}
          action={confirmation.type === 'reset' ? 'Redefinir' : 'Excluir'}
          returnFocus={confirmation.trigger}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirmOperation}
        />
      )}

    </div>
    </>
  )
}

export default App
