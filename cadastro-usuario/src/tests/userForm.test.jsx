import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { toast } from 'react-hot-toast'
import usersData from 'users-data'
import App from '../App'
import UserCard from '../components/UserCard'
import ConfirmationDialog from '../components/ConfirmationDialog'
import { demoUsers } from '../data/demoUsers'
import { validateCep } from '../utils/validateCep'

const hooks = vi.hoisted(() => ({ slots: [], cursor: 0, effects: [] }))
vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal()),
  useState(initial) {
    const index = hooks.cursor++
    if (!(index in hooks.slots)) {
      hooks.slots[index] = typeof initial === 'function' ? initial() : initial
    }
    return [hooks.slots[index], (value) => {
      hooks.slots[index] = typeof value === 'function' ? value(hooks.slots[index]) : value
    }]
  },
  useRef(initial) {
    const index = hooks.cursor++
    return hooks.slots[index] ??= { current: initial }
  },
  useCallback(callback) {
    return callback
  },
  useEffect(effect, dependencies) {
    const index = hooks.cursor++
    const previous = hooks.slots[index]
    if (!previous || dependencies.some((value, i) => !Object.is(value, previous[i]))) {
      hooks.slots[index] = dependencies
      hooks.effects.push(effect)
    }
  }
}))
vi.mock('users-data', () => ({
  default: { listUsers: vi.fn(), createUser: vi.fn(), updateUser: vi.fn(), removeUser: vi.fn(), resetUsers: vi.fn() }
}))
vi.mock('react-hot-toast', () => ({
  Toaster: () => null,
  toast: { error: vi.fn(), success: vi.fn() }
}))

function elements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => elements(child, predicate))
  if (!node?.props) return []
  return [
    ...(predicate(node) ? [node] : []),
    ...elements(node.props.children, predicate)
  ]
}

function renderApp() {
  hooks.cursor = 0
  return App()
}

function render() {
  const tree = renderApp()
  return {
    input: (label) => elements(tree, ({ props }) => props.placeholder === label)[0].props,
    button: (label) => elements(tree, ({ type, props }) => type === 'button' && props.children === label)[0]?.props,
    card: () => elements(tree, ({ type }) => type === UserCard)[0]?.props,
    confirmation: () => elements(tree, ({ type }) => type === ConfirmationDialog)[0]?.props,
    find: (predicate) => elements(tree, predicate)[0]?.props,
    submit: () => elements(tree, ({ type }) => type === 'form')[0].props.onSubmit({ preventDefault: vi.fn() })
  }
}

function change(label, value) {
  render().input(label).onChange({ target: { value } })
}

function deferred() {
  let resolve
  const promise = new Promise((complete) => { resolve = complete })
  return { promise, resolve }
}

const [example, otherExample] = demoUsers
const fields = {
  Nome: 'name', CPF: 'cpf', Email: 'email', Idade: 'age', CEP: 'cep',
  Rua: 'rua', Número: 'numero', Bairro: 'bairro', Cidade: 'cidade', Estado: 'estado'
}

beforeEach(async () => {
  hooks.cursor = 0
  hooks.slots = []
  hooks.effects = []
  vi.resetAllMocks()
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: vi.fn() })
  vi.stubGlobal('fetch', vi.fn())
  usersData.listUsers.mockResolvedValue([example, otherExample])
  render()
  hooks.effects.forEach((effect) => effect())
  await vi.waitFor(() => expect(render().card()?.busy).toBe(false))
})

afterEach(() => vi.unstubAllGlobals())

describe('Fluxos do formulário de usuários', () => {
  test('carrega o registro completo, preserva o endereço ao salvar e atualiza o cartão', async () => {
    render().card().onEdit(example)
    for (const [label, field] of Object.entries(fields)) {
      expect(render().input(label).value).toBe(example[field])
    }
    expect(fetch).not.toHaveBeenCalled()

    const { id, ...data } = example
    usersData.updateUser.mockResolvedValue({ ...example, name: 'Pessoa Atualizada' })
    change('Nome', 'Pessoa Atualizada')
    await render().submit()
    expect(usersData.updateUser).toHaveBeenCalledWith(id, { ...data, name: 'Pessoa Atualizada' })
    expect(render().card().user).toEqual({ ...example, name: 'Pessoa Atualizada' })
    expect(render().button('Cadastrar')).toBeDefined()
  })

  test('cancela a edição, limpa todos os campos e mantém o registro', () => {
    render().card().onEdit(example)
    render().button('Cancelar Edição').onClick()
    for (const label of Object.keys(fields)) expect(render().input(label).value).toBe('')
    expect(render().button('Cadastrar')).toBeDefined()
    expect(render().card().user).toEqual(example)
    expect(usersData.updateUser).not.toHaveBeenCalled()
  })

  test.each(['01001', '11111-111', '010010000', '01a01000'])('rejeita o CEP inválido %s', async (cep) => {
    render().card().onEdit(example)
    change('CEP', cep)
    await render().submit()
    expect(toast.error).toHaveBeenCalledWith('Digite um CEP válido com oito dígitos')
    expect(fetch).not.toHaveBeenCalled()
    expect(usersData.updateUser).not.toHaveBeenCalled()
  })

  test('aceita oito dígitos com ou sem hífen', () => {
    expect(validateCep('01001000')).toBe(true)
    expect(validateCep('01001-000')).toBe(true)
  })

  test('aborta a consulta anterior e ignora uma resposta antiga entregue depois da atual', async () => {
    const old = deferred()
    const latest = deferred()
    fetch.mockReturnValueOnce(old.promise).mockReturnValueOnce(latest.promise)
    change('CEP', '01001000')
    change('CEP', '20040-020')
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true)
    latest.resolve({ ok: true, json: async () => ({ cep: '20040-020', logradouro: 'Rua Nova' }) })
    await vi.waitFor(() => expect(render().input('Rua').value).toBe('Rua Nova'))
    old.resolve({ ok: true, json: async () => ({ cep: '01001-000', logradouro: 'Rua Antiga' }) })
    await Promise.resolve()
    await Promise.resolve()
    expect(render().input('Rua').value).toBe('Rua Nova')
  })

  test('permite endereço manual se o serviço falhar e valida os campos necessários', async () => {
    fetch.mockRejectedValue(new Error('offline'))
    render().card().onEdit(example)
    change('CEP', '20040020')
    await vi.waitFor(() => expect(render().input('Rua').readOnly).toBe(false))
    await render().submit()
    expect(usersData.updateUser).not.toHaveBeenCalled()

    change('Rua', 'Rua Manual')
    change('Bairro', 'Centro')
    change('Cidade', 'Rio de Janeiro')
    change('Estado', 'RJ')
    usersData.updateUser.mockResolvedValue({ ...example, cep: '20040-020', rua: 'Rua Manual' })
    await render().submit()
    expect(usersData.updateUser).toHaveBeenCalledWith(example.id, expect.objectContaining({
      cep: '20040-020', rua: 'Rua Manual', bairro: 'Centro', cidade: 'Rio de Janeiro', estado: 'RJ'
    }))
  })

  test('bloqueia o envio quando o ViaCEP informa que o CEP não existe', async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ erro: true }) })
    render().card().onEdit(example)
    change('CEP', '99999888')
    await vi.waitFor(() => expect(toast.error).toHaveBeenCalledWith('CEP não encontrado'))
    await render().submit()
    expect(usersData.updateUser).not.toHaveBeenCalled()
  })

  test('identifica o usuário na confirmação e preserva o registro ao cancelar', async () => {
    const card = render().card()
    const trigger = { focus: vi.fn() }
    const deleteButton = elements(UserCard(card), ({ props }) => props.children === 'Excluir')[0]
    deleteButton.props.onClick({ currentTarget: trigger })
    const confirmation = render().confirmation()
    expect(confirmation.message).toBe(`Excluir o usuário ${example.name}?`)
    expect(confirmation.returnFocus).toBe(trigger)
    confirmation.onCancel()
    expect(render().confirmation()).toBeUndefined()
    expect(usersData.removeUser).not.toHaveBeenCalled()
    expect(render().card().user).toEqual(example)
  })

  test('faz uma única exclusão pendente e só atualiza a lista após o sucesso', async () => {
    const removal = deferred()
    usersData.removeUser.mockReturnValue(removal.promise)
    render().card().onDelete(example)
    const { onConfirm } = render().confirmation()
    const pending = onConfirm()
    await onConfirm()
    render().card().onDelete(example)
    expect(render().confirmation()).toBeUndefined()
    expect(usersData.removeUser).toHaveBeenCalledExactlyOnceWith(example.id)
    expect(render().card().user).toEqual(example)
    removal.resolve()
    await pending
    expect(render().card().user).toEqual(otherExample)
  })

  test('mostra o erro de exclusão e mantém o registro disponível para nova tentativa', async () => {
    usersData.removeUser.mockRejectedValueOnce(new Error('Falha de conexão'))
    render().card().onDelete(example)
    await render().confirmation().onConfirm()
    expect(toast.error).toHaveBeenCalledWith('Falha de conexão')
    expect(render().card().user).toEqual(example)
    render().card().onDelete(example)
    await render().confirmation().onConfirm()
    expect(usersData.removeUser).toHaveBeenCalledTimes(2)
  })
})

describe('Acessibilidade e estados da interface', () => {
  test('associa labels aos campos, identifica a busca e descreve os erros no campo', async () => {
    for (const label of [...Object.keys(fields), 'Pesquisar usuário']) {
      const text = label === 'Pesquisar usuário' ? label + '...' : label
      const input = render().input(text)
      expect(render().find(({ type, props }) => type === 'label' && props.htmlFor === input.id).children).toBe(label)
    }
    expect(render().find(({ type, props }) => type === 'button' && props['aria-label'] === 'Pesquisar usuários')).toBeDefined()
    await render().submit()
    const input = render().input('Nome')
    expect(input['aria-invalid']).toBe(true)
    expect(render().find(({ props }) => props.id === input['aria-describedby']).children).toBe('Informe o nome.')
    change('Nome', 'Nome Fictício')
    expect(render().input('Nome')['aria-invalid']).toBeUndefined()
  })

  test('anuncia carregamento, mostra erro, tenta novamente e distingue lista vazia', async () => {
    hooks.slots = []
    hooks.effects = []
    const firstLoad = deferred()
    usersData.listUsers.mockReturnValueOnce(firstLoad.promise)
    const status = () => render().find(({ props }) => props.role === 'status').children
    expect(status()).toBe('Carregando usuários…')
    hooks.effects.forEach((effect) => effect())
    firstLoad.resolve(Promise.reject(new Error('Falha simulada')))
    await vi.waitFor(() => expect(render().button('Tentar novamente')?.['aria-disabled']).toBe(false))
    const retry = deferred()
    usersData.listUsers.mockReturnValueOnce(retry.promise)
    const retryButton = render().button('Tentar novamente')
    retryButton.onClick()
    retryButton.onClick()
    expect(status()).toBe('Carregando usuários…')
    expect(usersData.listUsers).toHaveBeenCalledTimes(3)
    retry.resolve([])
    await vi.waitFor(() => expect(status()).toBe('Nenhum usuário cadastrado.'))
    expect(render().button('Tentar novamente')).toBeUndefined()
  })

  test('Enter aplica a pesquisa e anuncia a busca sem resultados', () => {
    change('Pesquisar usuário...', 'Sem correspondência')
    const event = { key: 'Enter', preventDefault: vi.fn() }
    render().input('Pesquisar usuário...').onKeyDown(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(render().find(({ props }) => props.role === 'status').children).toBe('Nenhum usuário encontrado para esta busca.')
    expect(render().card()).toBeUndefined()
    expect(usersData.createUser).not.toHaveBeenCalled()
  })

  test('mostra o envio pendente e impede uma segunda gravação', async () => {
    const update = deferred()
    usersData.updateUser.mockReturnValue(update.promise)
    render().card().onEdit(example)
    const pending = render().submit()
    expect(render().button('Atualizando…')['aria-disabled']).toBe(true)
    await render().submit()
    expect(usersData.updateUser).toHaveBeenCalledTimes(1)
    update.resolve(example)
    await pending
    expect(render().button('Cadastrar')['aria-disabled']).toBe(false)
  })

  test('abre um diálogo nomeado com foco em Cancelar e restaura o foco ao receber Escape', () => {
    hooks.cursor = 0
    hooks.slots = []
    hooks.effects = []
    const returnFocus = { focus: vi.fn() }
    const onCancel = vi.fn()
    const onConfirm = vi.fn()
    const dialog = ConfirmationDialog({ message: 'Excluir o usuário?', action: 'Excluir', returnFocus, onCancel, onConfirm })
    const element = { showModal: vi.fn(), close: vi.fn() }
    const cancel = { focus: vi.fn() }
    dialog.props.ref.current = element
    elements(dialog, ({ props }) => props.children === 'Cancelar')[0].props.ref.current = cancel
    hooks.effects[0]()
    expect(dialog.type).toBe('dialog')
    expect(elements(dialog, ({ props }) => props.id === dialog.props['aria-labelledby'])[0].props.children).toBe('Excluir o usuário?')
    expect(element.showModal).toHaveBeenCalled()
    expect(cancel.focus).toHaveBeenCalled()
    const event = { preventDefault: vi.fn() }
    dialog.props.onCancel(event)
    expect(event.preventDefault).toHaveBeenCalled()
    expect(element.close).toHaveBeenCalled()
    expect(returnFocus.focus).toHaveBeenCalled()
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  test.skipIf(import.meta.env.MODE !== 'demo')('confirma a redefinição da demo uma única vez', async () => {
    const reset = deferred()
    usersData.resetUsers.mockReturnValue(reset.promise)
    const trigger = { focus: vi.fn() }
    render().button('Redefinir dados da demonstração').onClick({ currentTarget: trigger })
    const cancelled = render().confirmation()
    expect(cancelled.returnFocus).toBe(trigger)
    cancelled.onCancel()
    expect(usersData.resetUsers).not.toHaveBeenCalled()

    render().button('Redefinir dados da demonstração').onClick({ currentTarget: trigger })
    const confirmation = render().confirmation()
    expect(confirmation.action).toBe('Redefinir')
    const pending = confirmation.onConfirm()
    await confirmation.onConfirm()
    expect(usersData.resetUsers).toHaveBeenCalledTimes(1)
    reset.resolve([otherExample])
    await pending
    expect(render().card().user).toEqual(otherExample)
  })
})
