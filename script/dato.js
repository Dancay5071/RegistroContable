class Dato{
    constructor(monto){
        this._monto = monto;
    }

    get monto(){
        return this._monto;
    }
    set monto(valor){
        this._monto = valor;
    }
}