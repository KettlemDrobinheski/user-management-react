import './UserCard.css'

function UserCard({ user, onDelete, onEdit }) {
  console.log(onEdit);
    return(
        <div className="user-card">
            <img 
                className="user-card-avatar" 
                src={`https://robohash.org/${user.id}.png`}
                alt={user.name} 
            />

            <div className="user-card-info">
                <p>Nome: {user.name}</p>
                <p>CPF: {user.cpf}</p>
                <p>Email: {user.email}</p>
                <p>Idade: {user.age}</p>
                <p>CEP: {user.cep}</p>
              
              </div>

              <div className="user-card-buttons">
                <button onClick={() => onEdit(user)}>Editar</button>

              <button onClick={() => onDelete(user.id)}>Excluir</button>
            </div>
        </div>
    )

}

export default UserCard