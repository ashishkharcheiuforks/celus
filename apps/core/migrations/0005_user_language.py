# Generated by Django 2.2.4 on 2019-08-05 06:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0004_identity_verbosename'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='language',
            field=models.CharField(choices=[('en', 'English'), ('cs', 'Czech')], default='cs', help_text="User's preferred language", max_length=2),
        ),
    ]
