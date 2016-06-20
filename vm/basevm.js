const {observable, computed, extendObservable, autorunAsync} = mobx;
const {observer} = mobxReact;
const {Component} = React;

class FieldVM {
  @observable _value;
  @observable _interacted;
  @observable _valid = true;
  @observable errorMessage;
  _originalErrorMessage;
  
  markAsTouch() {
    if (!this._touched) {
      this._touched = true;
    }
  }

  @computed get valid() {
    return this._valid;
  }

  get value() {
    return this._value;
  }

  set value(val) {
    if (!this._interacted) {
      this._interacted = true;
    }
    this._value = val;

    this.validate();
  }

  validate(force = false) {
    if (!this._validateFn) {
      return;
    }

    if (!force && !this._interacted) {
      // if we're not forcing the validation
      // and we haven't interacted with the field
      // we asume this field pass the validation status
      this._valid = true;
      this.errorMessage = '';
      return;
    }
    const res = this._validateFn(this, this.model.fields);

    // if the function returned a boolean we assume it is
    // the flag for the valid state
    if (typeof res === 'boolean') {
      this._valid = res;
      this.errorMessage = res ? '' : this._originalErrorMessage;
      return;
    }

    // otherwise we asumme we have received a promise
    const p = Promise.resolve(res);
    return new Promise((resolve) => { // eslint-disable-line consistent-return
      p.then(
        () => {
          this._valid = true;
          this.errorMessage = '';
          resolve(); // we use this to chain validators
        },
        ({ error } = {}) => {
          this.errorMessage = (error || '').trim() || this._originalErrorMessage;
          this._valid = false;
          resolve(); // we use this to chain validators
        });
    });
  }

  constructor(model, value, validatorDescriptor = {}) {
    this.model = model;
    this.value = value;
    this._originalErrorMessage = validatorDescriptor.errorMessage;
    this._validateFn = validatorDescriptor.fn || () => Promise.resolve();
  }
}

class FormVM {
  @observable fields = {};
  @observable validating = false;
  @computed get valid() {
    if (this.validating) {
      return false; // consider the form invalid until the validation process finish
    }
    const keys = Object.keys(this.fields);
    return keys.reduce((seq, key) => {
      const field = this.fields[key];
      seq = seq && field.valid;
      return seq;
    }, true);
  }

  fieldKeys() {
    return Object.keys(this.fields);
  }

  validate() {
    this.validating = true;
    const p = this.fieldKeys().reduce((seq, key) => {
      const field = this.fields[key];
      return seq.then(() => field.validate(true));
    }, Promise.resolve());
    p.then(() => (this.validating = false));
    return p
  }
    
  toJSON() {
    const keys = Object.keys(this.fields);
    return keys.reduce((seq, key) => {
      const field = this.fields[key];
      seq[key] = field.value;
      return seq;
    }, {});
  }
  
  constructor(initialState = {}, validators = {}) {
    const keys = Object.keys(initialState);

    keys.forEach((key) => {
      extendObservable(this.fields, {
        [key]: new FieldVM(this, initialState[key], validators[key])
      });
    });

    autorunAsync(() => {
      this.onChange && this.onChange(this.valid, this.toJSON());
    }, 100);
  } 
}



