import { useState, useEffect } from 'react';
import './App.css'
import UserCard from './components/UserCard'

function App() {
  const [name, setName] = useState('')
  const [cpf, setCpf] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('')

  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('users')

    return savedUsers ? JSON.parse(savedUsers) : []
  });
  
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

  useEffect(() => {
    console.log("Componente carregou!");
  }, []);

  function handleSubmit(event) {
    event.preventDefault()

    if (!name || !email || !age || !cpf) {
      alert("preencha todos os campos")
      return
    }

    const nomeValido = /^[A-Za-zÀ-ÿ\s]+$/.test(name);

    if (!nomeValido) {
      alert("Digite um nome válido")
      return
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!emailValido) {
      console.log("CPF recusado:", cpf)
      alert("Digite um email válido")
      return
    }

    if (!validarCpf(cpf)) {
      alert("Digite um CPF válido")
      return
    }

    const emailExiste = users.some(
      user => user.email.toLowerCase() === email.toLowerCase()
    )

    if(emailExiste) {
      alert("Esse email já está cadatrado")
      return
    }

    const nomeExiste = users.some(
      user => user.name.toLowerCase() === name.toLowerCase()
    )

    if (nomeExiste) {
      alert("Esse nome já está cadastrado")
      return
    }

  const cpfExiste = users.some(
    user => user.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '')
  )

  if (cpfExiste) {
    alert("Esse CPF já está cadastrado")
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
      }

      setUsers([...users, newUser])
    }

    setName('')
    setCpf('')
    setEmail('')
    setAge('')
  }

  function deleteUser(id) {
    const updatedUsers = users.filter((user) => user.id !== id)

    setUsers(updatedUsers)

    localStorage.setItem('users', JSON.stringify(updatedUsers))
  }

   function editUser(user) {
    setEditingUser(user);
    
    setName(user.name);
    setCpf(user.cpf);
    setEmail(user.email);
    setAge(user.age);
  }

  function formatCpf(value) {
    return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .slice(0, 14);
  }

  function validarCpf(cpf) {
    const cpfLimpo = cpf.replace(/\D/g, '')

    if (cpfLimpo.length !== 11) {
      return false
    }

    if (/^(\d)\1{10}$/.test(cpfLimpo)) {
      return false
    }

    let soma = 0 

    for (let i = 0; i < 9; i++) {
      soma += Number(cpfLimpo[i]) * (10 - i)
    }

    let resto = soma % 11
    let primeiroDigito = resto < 2 ? 0 : 11 - resto

    if (primeiroDigito !== Number(cpfLimpo[9])) {
      return false
    }

    soma = 0

    for (let i = 0; i < 10; i++) {
      soma += Number(cpfLimpo[i]) * (11 -i)
    }

    resto = soma % 11
    let segundoDigito = resto < 2 ? 0 : 11 - resto

    if (segundoDigito !== Number(cpfLimpo[10])) {
      return false
    }

    return true
  }


  return (
    <div className="App">

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

{users.map((user) => (
      <UserCard 
      key={user.id} 
      user={user}
      onDelete={deleteUser}
      onEdit={editUser}
      />
))}
      </div>

    </div>
  )
}

export default App