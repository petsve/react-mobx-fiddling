const {observable, computed, extendObservable, autorunAsync} = mobx;
const {observer} = mobxReact;
const {Component} = React;

@observer
class FormView extends Component {
    async handleSend(form) {
      // this is needed to ensure all validators are executed
      // validators can be extended to memoize results,
      // only are evaluated if the input changed
      await form.validate();
      if (form.valid) {
        console.log('send your data here');
      }
    }
    render() {
        const {form} = this.props;
        
        return <div>
          <p>Form</p>
          { form.validating && <p>Validating form!</p>}
          <p>data : {JSON.stringify(form.toJSON()) }</p>
					<p>data valid: { '' + form.valid }</p>
          <InputView vm={form.fields.user} />
          <InputView vm={form.fields.password} />
          <button onClick={ () => this.handleSend(form) } disabled={!form.valid} >Send</button>
        </div>;
    }
}

@observer
class InputView extends Component {
    render() {
        const {vm} = this.props;
        
        return <div>
           <input
            type="text"
            value={vm.value}
            onChange={(e) => vm.value = e.target.value}
          />
          <p>{ vm.errorMessage }</p>
        </div>;
    }
}

@observer
class LabelView extends Component {
    render() {
        const {vm} = this.props;
        return <div>{vm.value}</div>;
    }
}
