# Generated by Django 5.1.7 on 2025-04-15 14:45

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('API', '0003_alter_updatecode_expire_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='type',
            field=models.CharField(choices=[('tabak', 'Tabak'), ('kase', 'Kase'), ('bardak', 'Bardak'), ('takım', 'Takım'), ('diğer', 'Diğer')], default='diğer', max_length=50),
        ),
        migrations.AlterField(
            model_name='updatecode',
            name='expire_date',
            field=models.DateTimeField(default=datetime.datetime(2025, 4, 15, 14, 50, 3, 786475, tzinfo=datetime.timezone.utc)),
        ),
    ]
