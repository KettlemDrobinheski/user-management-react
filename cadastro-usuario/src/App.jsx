import { useState, useEffect } from 'react';
import './App.css'
import UserCard from './components/UserCard'

function App() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [age, setAge] = useState('')
  const [users, setUsers] = useState([]);
  

  function buscarUsuarios() {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then((resposta) => resposta.json())
      .then((dados) => { 
        setUsers(dados)
      })
  }

  useEffect(() => {
    buscarUsuarios();
    console.log("Componente carregou!");
  }, []);

  function handleSubmit(event) {
    event.preventDefault()

    if (!name || !email || !age) {
      alert("preencha todos os campos")
      return
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      age,
    }

    setUsers([...users, newUser])

    setName('')
    setEmail('')
    setAge('')
  }

  function deleteUser(id) {
    setUsers(users.filter((user) => user.id !== id))
  }

  return (
    <div className="App">

      <h1>Cadastro de Usuários</h1>

      <p>Total de Ususarios: {users.length}</p>

      <form onSubmit={handleSubmit}>

        <input
          placeholder="Nome"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          Cadastrar
        </button>

      </form>

      <div className="user-list">

{users.map((user) => (
      <UserCard 
      key={user.id} 
      user={user}
      onDelete={deleteUser}
      />
))}
      </div>

    </div>
  )
}

export default App