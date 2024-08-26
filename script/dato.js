class Dato {
    constructor(mes, descripcion, monto) {
        this.mes = mes;
        this.descripcion = descripcion; 
        this.monto = monto;   
                 
    }
    get mes() {
        return this._mes;
    }
    set mes(valor){
        this._mes = valor;
    }
    get descripcion() {
        return this._descripcion;
    }

    set descripcion(valor) {
        if (typeof valor !== 'string' || valor.trim() === '') {
            throw new Error('La descripción no debe estar vacía.');
        }
        this._descripcion = valor;
    }

    get monto() {
        return this._monto;
    }

    set monto(valor) {
        if (isNaN(valor) || valor <= 0) {
            throw new Error('El monto debe ser un número positivo.');
        }
        this._monto = parseFloat(valor);
    }
}