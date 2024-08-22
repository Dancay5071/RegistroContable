class Ingreso extends Dato {
    static contadorIngresos = 0;

    constructor(descripcion, monto) {
        super(descripcion, monto);
        this._id = ++Ingreso.contadorIngresos;
    }

    get id() {
        return this._id;
    }
}
