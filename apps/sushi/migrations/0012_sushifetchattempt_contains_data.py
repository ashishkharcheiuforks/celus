# Generated by Django 2.2.4 on 2019-08-28 12:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sushi', '0011_sushifetchattempt_error_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='sushifetchattempt',
            name='contains_data',
            field=models.BooleanField(default=False, help_text='Does the report actually contain data for import'),
        ),
    ]