import React, { useState, useEffect, useContext } from 'react'
import { TextField, Typography, Grid, Button, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { ExpenseTrackerContext } from '../../../context/context';
import { v4 as uuidv4 } from 'uuid';
import { useSpeechContext } from '@speechly/react-client';

import formatDate from '../../../utils/formatDate'
import useStyles from './styles';
import { incomeCategories, expenseCategories } from '../../../constants/categories';


const insitialState = {
    amount: '',
    category: '',
    type: 'Income',
    date: formatDate(new Date()),
}

const From = () => {
const classes = useStyles();
const [formData, setFormData] = useState(insitialState)
const { addTransaction } = useContext(ExpenseTrackerContext);
const { segment } = useSpeechContext();


const createTransaction = () => {
    // if((Number.isNumber(formData.amount)) || !formData.date.includes('-')) return;
    const transaction = {...formData, amount: Number(formData.amount), id: uuidv4()}
    addTransaction(transaction);
    setFormData(insitialState);
}

useEffect(() => {
    if(segment) {
        if(segment.intent.intent === 'add_expense') {
            setFormData({ ...formData, type: 'Expense' });
        } else if(segment.intent.intent === 'add_income') {
            setFormData({ ...formData, type: 'Income' });
        } else if(segment.isFinal && segment.intent.intent === "create_transaction") {
            return createTransaction();
        } else if(segment.isFinal && segment.intent.intent === "cancel_transaction") {
            return setFormData(insitialState);
        }

        segment.entities.forEach((e)=> {
            const category = `${e.value.charAt(0)}${e.value.slice(1).toLocaleLowerCase()}`;
            switch(e.type) {
                case 'amount':
                    setFormData({ ...formData, amount: e.value });
                    break;
                case 'category':
                    if(incomeCategories.map((iC) => iC.type).includes(category)) {
                        setFormData({...formData, type: 'Income', category});
                    } else if(expenseCategories.map((iC) => iC.type).includes(category)) {
                        setFormData({...formData, type: 'Expense', category});
                    }
                    
                    break;
                case 'date':
                    setFormData({...formData, date: e.value});
                    break;
                    default: break;

            }
        });
        if(segment.isFinal && formData.amount && formData.category && formData.type && formData.date) {
            createTransaction();
        }
    }
}, [segment]);

const selectedCategories = formData.type === 'Income'? incomeCategories : expenseCategories;

  return (
    <Grid container spacing={2}>
        <Grid item xs={12}>
            <Typography align="center" variant="subtitle2" gutterBottom>
                {segment &&  segment.words.map((w) => w.value).join(" ")}
            </Typography>
        </Grid>
        <Grid item xs={6}>
            <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={formData.type} onChange={(e)=>setFormData({...formData, type: e.target.value})}>
                    <MenuItem value="Income">Income</MenuItem>
                    <MenuItem value="Expense">Expense</MenuItem>
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={6}>
            <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                    {selectedCategories.map((c) => <MenuItem key={c.type} value={c.type}>{c.type}</MenuItem>)}
                </Select>
            </FormControl>
        </Grid>
        <Grid item xs={6}>
            <TextField type="number" label="Amount" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} fullWidth />
        </Grid>
        <Grid item xs={6}>
            <TextField fullWidth label="Date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: formatDate(e.target.value) })} />
        </Grid>
        <Button className={classes.button} variant="outlined" color="primary" fullWidth onClick={createTransaction}>Create</Button>
    </Grid>
  )
}

export default From
