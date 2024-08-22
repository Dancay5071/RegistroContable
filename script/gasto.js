class Gasto extends Dato{
    static contadorGasto = 0;

    constructor(descripcion, monto){
        super(descripcion, monto);
        this._id = ++Gasto.contadorGasto;
    }
    get id(){
        return this._id;
    }
}