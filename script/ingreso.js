class Ingreso extends Dato{
    static contadorIngresos = 0;

    constructor(monto){
        super(monto);
        this._id = ++Ingreso.contadorIngresos;
    }
    get id(){
        return this._id;
    }
}
