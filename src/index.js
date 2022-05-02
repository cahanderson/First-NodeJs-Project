const express = require("express");
const {v4:uuidv4} = require('uuid')

const app = express();
app.use(express.json())
const customers = [];

//Middleware
//Verificacao de CPF
function verifyIfExistsCpf(request, response, next){
  const {cpf} = request.headers;
  const customer = customers.find((customer)=>{
    return customer.cpf === cpf
  });
  if(!customer){
    return response.status(400).json({error: "Customer not exists"})
  };
  request.customer = customer;
  return next();
}

//funcao para operacao de Saque e Deposito
function getBalance(statement){
  const balance = statement.reduce((acc, operation) =>{
    if(operation.type === "credit"){
      return acc + operation.amount;
    }else{
      return acc - operation.amount;
    }
  },0)
  return balance;
}

//routes
//Verificacao de conta - create
app.post("/acount",(request, response)=>{
  const{nome, cpf} = request.body;
  const cpfAlreadyExists = customers.some((customer) => {
    return customer.cpf === cpf
  })
  if(cpfAlreadyExists){
    return response.status(400).json({error: "Cpf already exists"})
  }
  customers.push({
    cpf,
    nome,
    id: uuidv4(),
    statement:[],
  });
  return response.status(201).send()
})

// Saldo bancario
app.get("/statement",verifyIfExistsCpf,(request, response)=>{
  const {customer} = request;
  return response.status(200).json(customer.statement)
})

//Saldo bancario por data
app.get("/statement/date",verifyIfExistsCpf,(request, response)=>{
  const {customer} = request;
  const {date} = request.query;

  const dateFormat = new Date(date + " 00:00");

  const statements = customer.statement.filter((statement) =>
   statement.created_at.toDateString() ===
   new Date(dateFormat).toDateString())
  return response.json(statements)
});

//deposito bancario
app.post("/deposit",verifyIfExistsCpf, (request, response)=>{
  const {description, amount} = request.body;
  const {customer} = request;

  const operation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  }
  customer.statement.push(operation);
  return response.status(201).send();
})

//Saque bancario
app.post("/withdraw", verifyIfExistsCpf,(request,response)=>{
  const {amount} = request.body;
  const {customer} = request;
  const balance = getBalance(customer.statement)
  
  if(amount > balance){
    return response.status(400).json({error :'valor de saque maior do que em conta'})
  }

  const  withdraw = {
    amount,
    created_at : new Date(),
    type:"debit"
  }
  customer.statement.push(withdraw);
  return response.status(201).send();
})

//update
app.put("/account", verifyIfExistsCpf, (request, response)=>{
  const {name} = request.body;
  const {customer} = request;

  customer.nome = name;
  return response.status(201).send();
})

//Mostrar em tela dados do usuario
app.get("/account", verifyIfExistsCpf, (request,response)=>{
  const{customer} = request;
  return response.json(customer)

})

//Delete
app.delete("/account", verifyIfExistsCpf, (request, response)=>{
  const {customer} = request;
  customers.splice(customers.indexOf(customer),1);

  return response.status(200).json(customer);
})

app.get("/balance",verifyIfExistsCpf,(request, response)=>{
  const {customer} = request;
  const balance = getBalance(customer.statement);

  return response.json(balance);
})



app.listen(3333);


