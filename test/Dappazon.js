const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ID = 1
const NAME = "Shoes"
const CATEGORY = "Clothing"
const IMAGE = "Nike img.."
const COST = tokens(1)
const RATING = 4
const STOCK = 5

describe("Dappazon", () => {

  let dappazon
  let deployer,buyer

  beforeEach(async() => {
    [deployer,buyer] = await ethers.getSigners()
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })

  describe("Deployement",() =>{
    it('has a owner', async() =>{
      expect(await dappazon.owner()).to.equal(deployer.address)
    })

  })

  describe("Listing",() => {
    let transaction
    
    beforeEach(async() =>{
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )

      await transaction.wait()
    })

    it("Returns item attribute", async() => {
      const item = await dappazon.items(ID)
      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emit list event", async() => {
      expect(transaction).to.emit(dappazon,"List")
    })
  })

  describe("Buying",() => {
    let transaction
    
    beforeEach(async() =>{
      transaction = await dappazon.connect(deployer).list(
        ID,
        NAME,
        CATEGORY,
        IMAGE,
        COST,
        RATING,
        STOCK
      )

      await transaction.wait()
      // Buy an item
      transaction = await dappazon.connect(buyer).buy(ID,{value:COST})
    })

    it("Update buyer's order count", async() => {
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.equal(1)

    })

    it("Adds an order", async() => {
      const order = await dappazon.orders(buyer.address,1)
      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it("Update account balance", async() => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(COST)
    })

    it("Emit buy event", () => {
      expect(transaction).to.emit(dappazon,"Buy")
    })




  })

  describe("Withdrawing",() => {
    let balanceBefore
    
    beforeEach(async() => {
      // List an item 
      let tranx = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await tranx.wait()
      // Buy an item
      tranx = await dappazon.connect(buyer).buy(ID, {value : COST})
      await tranx.wait()
      // Get deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)
      // Withdraw amount
      tranx = await dappazon.connect(deployer).withdraw()
      await tranx.wait()
    })

    it("Updates the owner balance",async() =>{
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it("Update the contract balance", async() =>{
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.equal(0)
    })




  })
  
})

