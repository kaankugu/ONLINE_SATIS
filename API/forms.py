from django import forms
from .models import Cards

class CardForm(forms.ModelForm):
    class Meta:
        model = Cards
        fields = ['card_number', 'card_holder', 'expiration_date', 'cvv']
        widgets = {
            'card_number': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Kart Numarası'}),
            'card_holder': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Kart Sahibi'}),
            'expiration_date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'cvv': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'CVV'}),
        }
