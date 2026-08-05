import { useState, useEffect } from 'react';
import './App.css'
import UserCard from './components/UserCard'
import { validateCPF } from './utils/validateCPF';
import { Toaster, toast } from 'react-hot-toast';

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
  const [festa, setFesta] = useState(false)
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('users')

    return savedUsers ? JSON.parse(savedUsers) : []
  });
  
  const filteredUsers = users.filter((user) =>
  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  user.email.toLowerCase().includes(searchTerm.toLowerCase())
)

  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users))
  }, [users])


  function buscarUsuarios() {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then((resposta) => resposta.json())
      .then((dados) => { 
        setUsers(dados)
      })
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!name || !email || !age || !cpf || !cep || !numero) {
      toast.error("preencha todos os campos")
      return
    }

    const nomeValido = /^[A-Za-zÀ-ÿ\s]+$/.test(name);

    if (!nomeValido) {
      toast.error("Digite um nome válido")
      return
    }

    if (!validateCPF(cpf)) {
  toast.error("Digite um CPF válido")
  return
}

    const emailExiste = users.some(
      user => user.email.toLowerCase() === email.toLowerCase()
    )

    if(emailExiste) {
      toast.error("Esse email já está cadatrado")
      return
    }

    const nomeExiste = users.some(
      user => user.name.toLowerCase() === name.toLowerCase()
    )

    if (nomeExiste) {
      toast.error("Esse nome já está cadastrado")
      return
    }

  const cpfExiste = users.some(
    user => user.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')
  )

  if (cpfExiste) {
    toast.error("Esse CPF já está cadastrado")
    return
  }

    if (editingUser) {
      const updatedUsers = users.map((user) =>
      user.id === editingUser.id
    ? { ...user, name, cpf, email, age }
    : user
)

setUsers (updatedUsers)
setEditingUser(null)

    } else {
      const newUser = {
        id: Date.now(),
        name,
        cpf,
        email,
        age,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        estado,
      }

      setUsers([...users, newUser])
      toast.success("Usuário cadastrado com sucesso!")

      setFesta(true)

      setTimeout(() => {
        setFesta(false)
      }, 3000)

    }

    setName('')
    setCpf('')
    setEmail('')
    setAge('')
    setCep('')
    setRua('')
    setNumero('')
    setBairro('')
    setCidade('')
    setEstado('')
  }

  function deleteUser(id) {
    const updatedUsers = users.filter((user) => user.id !== id)

    setUsers(updatedUsers)

    localStorage.setItem('users', JSON.stringify(updatedUsers))

    toast.success("Usuário removido com sucesso!")
  }

   function editUser(user) {
    setEditingUser(user);
    
    setName(user.name);
    setCpf(user.cpf);
    setEmail(user.email);
    setAge(user.age);
    setCep(user.cep);
  }

  function formatCpf(value) {
    return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
  }



  function formatCep(valor) {
    const cepLimpo = valor.replace(/\D/g, '').slice(0, 8)

      if (cepLimpo.length <= 5) {
        return cepLimpo
      }

      return cepLimpo.replace(/(\d{5})(\d)/, '$1-$2')
  }

  function validarCep(cep) {
    const cepLimpo = cep.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      return false
    }

    if  (/^(\d)\1{7}$/.test(cepLimpo)) {
      return false
    }

    return true
  }

  async function buscarCep(cepDigitado) {

    const cepLimpo = cepDigitado.replace(/\D/g, '')

    if (cepLimpo.length !== 8) {
      return
    }
    
    try {
    const resposta = await fetch(
      `https://viacep.com.br/ws/${cepLimpo}/json/`
    )

    const dados = await resposta.json()

    if(dados.erro) {
      toast.error("CEP não encontrado")
      return
    }

    setRua(dados.logradouro)
    setBairro(dados.bairro)
    setCidade(dados.localidade)
    setEstado(dados.uf)

  } catch (erro) {
    toast.error("Erro ao buscar o CEP.")
  }
  }

  function handleSearch() {
  setSearchTerm(search)
  }

  return (
    <>
      <Toaster 
      position="top-right"
      reverseOrder={false}
      />

    <div className="App">

    {festa && (
  <div className="festa">
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

      <p>Total de Usuarios: {users.length}</p>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Nome"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <input 
         placeholder="CPF"
         type="text"
         value={cpf}
         onChange={(event) => setCpf(formatCpf(event.target.value))}
         />

        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <input
          placeholder="Idade"
          type="number"
          value={age}
          onChange={(event) => setAge(event.target.value)}
        />

        <input
          placeholder="CEP"
          type="text"
          value={cep}
          onChange={(e) => {
            const valor = formatCep(e.target.value)

            setCep(valor)

            if (valor.length === 9) {
              buscarCep(valor)
            }
          }}
        />

        <input 
         type="text"
         placeholder="Rua"
         value={rua}
         readOnly
         />

         <input
          placeholder="Número"
          type="text"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
         />

         <input
          type="text"
          placeholder="Bairro"
          value={bairro}
          readOnly
          />

          <input
           type="text"
           placeholder="Cidade"
           value={cidade}
           readOnly
           />

           <input
            type="text"
            placeholder="Estado"
            value={estado}
            readOnly
            />


            <div className="search-container">
            <input
             type="text"
             placeholder="Pesquisar usuário..."
             value={search}
             onChange={(e) => setSearch(e.target.value)}
            />

  <button 
    type="button"
    onClick={handleSearch}
  >
    🔍
  </button>
  </div>

        <button type="submit">
          {editingUser ? "Atualizar" : "Cadastrar"}
        </button>

        {editingUser && (
          <button
          type="button"
          onClick={() => {
            setEditingUser(null)
            setName('')
            setEmail('')
            setAge('')
          }}
          >
            Cancelar Edição
          </button>
        )}

      </form>

      <div className="user-list">

{filteredUsers.map((user) => (
      <UserCard 
      key={user.id} 
      user={user}
      onDelete={deleteUser}
      onEdit={editUser}
      />
))}
      </div>

    </div>
    </>
  )
}

export default App