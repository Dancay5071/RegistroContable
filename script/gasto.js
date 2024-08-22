class Gasto extends Dato{
    static contadorGasto = 0;

    constructor(monto){
        super(monto);
        this._id = ++Gasto.contadorGasto;
    }
    get id(){
        return this._id;
    }
}