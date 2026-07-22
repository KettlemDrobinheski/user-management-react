import './UserCard.css'

function UserCard({user, onDelete}){
    return(
        <div className="user-card">
            <img 
                className="user-card-avatar" 
                src={`https://robohash.org/${user.id}.png`}
                alt={user.name} 
            />

            <div className="user-card-info">
                <p>Nome: {user.name}</p>
                <p>Email: {user.email}</p>
                <p>Idade: {user.age}</p>

              <button onClick={() => onDelete(user.id)}>
                Excluir
              </button>
            </div>

        </div>
    )

}

export default UserCard