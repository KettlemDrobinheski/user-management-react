import { useState, useEffect } from 'react';
import './App.css'
import UserCard from './components/UserCard'
import { validateCPF } from './utils/validateCPF';
import { validateAge } from './utils/validateAge';
import { validateEmail } from './utils/validateEmail';
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

  useEffect(() => {
  async function carregarUsuarios() {
    try {
      const resposta = await fetch('http://localhost:3000/usuarios')

      if (!resposta.ok) {
        throw new Error('Erro ao buscar usuários')
      }

     const dados = await resposta.json()

const usuariosFormatados = dados.map((usuario) => ({
  id: usuario.id,
  name: usuario.nome,
  cpf: usuario.cpf,
  email: usuario.email,
  age: usuario.idade,
  cep: usuario.cep,
  rua: usuario.rua,
  numero: usuario.numero,
  bairro: usuario.bairro,
  cidade: usuario.cidade,
  estado: usuario.estado
}))

setUsers(usuariosFormatados)

    } catch (erro) {
      console.error(erro)
      toast.error('Não foi possível carregar os usuários')
    }
  }

  carregarUsuarios()
}, [])

  function buscarUsuarios() {
    fetch('https://jsonplaceholder.typicode.com/users')
      .then((resposta) => resposta.json())
      .then((dados) => { 
        setUsers(dados)
      })
  }

 async function handleSubmit(event) {
  event.preventDefault()

  if (!name || !email || !age || !cpf || !cep || !numero) {
    toast.error("preencha todos os campos")
    return
  }

  if (!validateAge(age)) {
  toast.error("Você deve ter pelo menos 18 anos")
  return
}

if (!validateEmail(email)) {
  toast.error("Digite um e-mail válido")
  return
}

  const nomeValido = /^[A-Za-zÀ-ÿ\s]+$/.test(name)

  if (!nomeValido) {
    toast.error("Digite um nome válido")
    return
  }

  if (!validateCPF(cpf)) {
    toast.error("Digite um CPF válido")
    return
  }

  const emailExiste = users.some(
    user =>
      user.email.toLowerCase() === email.toLowerCase() &&
      user.id !== editingUser?.id
  )

  if (emailExiste) {
    toast.error("Esse email já está cadastrado")
    return
  }

  const nomeExiste = users.some(
    user =>
      user.name.toLowerCase() === name.toLowerCase() &&
      user.id !== editingUser?.id
  )

  if (nomeExiste) {
    toast.error("Esse nome já está cadastrado")
    return
  }

  const cpfExiste = users.some(
    user =>
      user.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, '') &&
      user.id !== editingUser?.id
  )

  if (cpfExiste) {
    toast.error("Esse CPF já está cadastrado")
    return
  }

  if (editingUser) {
  try {
    const resposta = await fetch(
      `http://localhost:3000/usuarios/${editingUser.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: name,
          cpf,
          email,
          idade: age,
          cep,
          rua,
          numero,
          bairro,
          cidade,
          estado
        })
      }
    )

    if (!resposta.ok) {
      const dados = await resposta.json()
      throw new Error(dados.erro || 'Erro ao atualizar usuário')
    }

    const usuarioAtualizado = await resposta.json()

    const usuarioFormatado = {
      id: usuarioAtualizado.id,
      name: usuarioAtualizado.nome,
      cpf: usuarioAtualizado.cpf,
      email: usuarioAtualizado.email,
      age: usuarioAtualizado.idade,
      cep: usuarioAtualizado.cep,
      rua: usuarioAtualizado.rua,
      numero: usuarioAtualizado.numero,
      bairro: usuarioAtualizado.bairro,
      cidade: usuarioAtualizado.cidade,
      estado: usuarioAtualizado.estado
    }

    setUsers((usuariosAtuais) =>
      usuariosAtuais.map((user) =>
        user.id === usuarioFormatado.id
          ? usuarioFormatado
          : user
      )
    )

    setEditingUser(null)

    toast.success("Usuário atualizado com sucesso!")

  } catch (erro) {
    console.error(erro)
    toast.error(erro.message || "Erro ao atualizar usuário")
    return
  }
}else {
    try {
      const resposta = await fetch('http://localhost:3000/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: name,
          cpf,
          email,
          idade: age,
          cep,
          rua,
          numero,
          bairro,
          cidade,
          estado
        })
      })

      if (!resposta.ok) {
        const dados = await resposta.json()
        throw new Error(dados.erro || 'Erro ao cadastrar usuário')
      }

      const usuarioCriado = await resposta.json()

      const usuarioFormatado = {
        id: usuarioCriado.id,
        name: usuarioCriado.nome,
        cpf: usuarioCriado.cpf,
        email: usuarioCriado.email,
        age: usuarioCriado.idade,
        cep: usuarioCriado.cep,
        rua: usuarioCriado.rua,
        numero: usuarioCriado.numero,
        bairro: usuarioCriado.bairro,
        cidade: usuarioCriado.cidade,
        estado: usuarioCriado.estado
      }

      setUsers((usuariosAtuais) => [
        ...usuariosAtuais,
        usuarioFormatado
      ])

      toast.success("Usuário cadastrado com sucesso!")

      setFesta(true)

      setTimeout(() => {
        setFesta(false)
      }, 3000)

    } catch (erro) {
      console.error(erro)
      toast.error(erro.message || "Erro ao cadastrar usuário")
      return
    }
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

  async function deleteUser(id) {
    try {
      const resposta = await fetch(`http://localhost:3000/usuarios/${id}`, {
        method: 'DELETE'
      })

      if (!resposta.ok) {
        const dados = await resposta.json()
        throw new Error(dados.erro || 'Não foi possível excluir o usuário')
      }

      setUsers((usuariosAtuais) =>
        usuariosAtuais.filter((user) => user.id !== id)
      )

      toast.success("Usuário removido com sucesso!")
    } catch (erro) {
      toast.error(erro.message || 'Erro ao excluir usuário')
    }
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
