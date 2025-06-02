async function cunharObras() {
  const contrato = await getContrato();
  const contas = await window.ethereum.request({ method: "eth_requestAccounts" });
  const user = contas[0];

  await mintTodos(contrato, user);
}
