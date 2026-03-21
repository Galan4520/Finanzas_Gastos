describe('HU-1.1 Pantalla de Bienvenida - Criterios Aceptación', () => {

    // 🔄 LIMPIA localStorage ANTES cada test
    beforeEach(() => {
        cy.clearLocalStorage()
        cy.on('uncaught:exception', () => false)
    })

    // ✅ CRITERIO 1: Sin localStorage → Muestra Welcome
    it('Criterio 1: Muestra Welcome sin scriptUrl/pin en localStorage', () => {
        cy.visit('http://localhost:3001')
        cy.get('body').should('not.be.empty')
        cy.contains(/bienvenid/i).should('be.visible')  // Case insensitive
        cy.url().should('include', '/welcome')          // No redirige
    })

    // ✅ CRITERIO 2: Campo URL Apps Script visible
    it('Criterio 2: Campo URL Google Apps Script existe', () => {
        cy.visit('http://localhost:3001')
        cy.get('input').eq(0).should('be.visible')
        cy.get('input').eq(0).should('be.enabled')
    })

    // ✅ CRITERIO 3: Campo PIN seguridad existe
    it('Criterio 3: Campo PIN seguridad existe', () => {
        cy.visit('http://localhost:3001')
        cy.get('input').eq(1).should('exist')
        cy.get('input').eq(1).should('have.attr', 'type', 'password')
    })

    // ✅ CRITERIO 4: Botón Conectar existe
    it('Criterio 4: Botón Conectar/Comenzar existe', () => {
        cy.visit('http://localhost:3001')
        cy.contains('button', /conectar|comenzar|aceptar/i).should('be.visible')
        cy.contains('button', /conectar|comenzar|aceptar/i).should('be.enabled')
    })

    // ✅ CRITERIO 5: Guía paso a paso visible
    it('Criterio 5: Guía instrucciones configuración visible', () => {
        cy.visit('http://localhost:3001')
        cy.contains(/paso|guía|instrucción|configur/i).should('be.visible')
        // o texto específico de tu app
        cy.contains(/apps script|google sheets|url|pin/i).should('be.visible')
    })
})
